// Multilingual Questions
const questions = {
  en: [
    "Please introduce yourself.",
    "Tell me about a recent challenge you faced.",
    "Have you ever resolved a conflict?",
    "Why did you apply for this position?"
  ],
  ko: [
    "자기소개를 해주세요.",
    "최근에 도전한 경험에 대해 말해주세요.",
    "갈등을 해결한 경험이 있나요?",
    "지원한 이유는 무엇인가요?"
  ]
};

let currentLang = 'en';

const langSelect = document.getElementById("langSelect");
const startBtn = document.getElementById("startBtn");
const prompt = document.getElementById("prompt");
const feedbackDiv = document.getElementById("feedback");
const questionBox = document.getElementById("questionBox");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;

langSelect.addEventListener("change", () => {
  currentLang = langSelect.value;
  recognition.lang = currentLang === 'ko' ? 'ko-KR' : 'en-US';
  updateTexts();
});

function updateTexts() {
  prompt.innerText = currentLang === 'ko'
    ? "Start 버튼을 누르면 면접 질문이 제시됩니다."
    : "Click Start to begin the interview.";
  questionBox.innerText = currentLang === 'ko'
    ? "💬 면접 질문이 여기에 표시됩니다."
    : "💬 Interview question will appear here.";
  startBtn.innerText = currentLang === 'ko' ? "시작" : "Start";
}

updateTexts();

function pickQuestion() {
  const langQuestions = questions[currentLang];
  return langQuestions[Math.floor(Math.random() * langQuestions.length)];
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(console.error);
}

startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  feedbackDiv.innerText = "";
  const q = pickQuestion();
  questionBox.innerText = currentLang === 'ko'
    ? `면접 질문: ${q}`
    : `Interview Question: ${q}`;
  prompt.innerText = currentLang === 'ko'
    ? "답변을 시작해주세요..."
    : "Please start your answer...";
  recognition.start();
});

recognition.onresult = async (e) => {
  const text = e.results[0][0].transcript;
  prompt.innerText = currentLang === 'ko'
    ? "답변 분석 중..."
    : "Analyzing your answer...";

  const expr = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();
  const happyScore = expr?.expressions.happy || 0;

  const unstableGaze = await detectUnstableGaze();

  // 종합 피드백 생성
  let feedback = currentLang === 'ko'
    ? `당신의 답변: "${text}"\n`
    : `Your answer: "${text}"\n`;

  // 답변 길이
  if (text.length < 10) {
    feedback += currentLang === 'ko'
      ? "답변이 너무 짧습니다. 내용을 더 구체적으로 말해보세요.\n"
      : "Your answer is too short. Try to elaborate more.\n";
  } else {
    feedback += currentLang === 'ko'
      ? "충분한 분량의 답변을 했습니다. 좋아요!\n"
      : "You gave a well-elaborated answer. Nice job!\n";
  }

  // 표정 밝기
  if (happyScore > 0.4) {
    feedback += currentLang === 'ko'
      ? "밝은 표정은 좋은 인상을 줍니다.\n"
      : "A pleasant expression leaves a good impression.\n";
  } else {
    feedback += currentLang === 'ko'
      ? "표정이 다소 딱딱해 보일 수 있습니다. 미소를 지어보세요.\n"
      : "Your expression seemed a bit tense. Try to smile more.\n";
  }

  // 시선 안정성
  if (unstableGaze) {
    feedback += currentLang === 'ko'
      ? "시선이 자주 흔들렸습니다. 면접관의 눈을 응시하듯 카메라를 바라보세요.\n"
      : "Your gaze was unstable. Try to maintain eye contact by looking at the camera.\n";
  } else {
    feedback += currentLang === 'ko'
      ? "시선이 안정적으로 유지되었습니다. 아주 좋습니다.\n"
      : "You maintained stable eye contact. Well done!\n";
  }

  feedbackDiv.innerText = feedback;
  startBtn.style.display = "inline";
  updateTexts();
};

// 시선 흔들림 감지 (고개 흔들림 대체)
async function detectUnstableGaze() {
  const frames = 10;
  const delay = 100;
  const positions = [];

  for (let i = 0; i < frames; i++) {
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
    if (detection) positions.push(detection.box.x);
    await new Promise(r => setTimeout(r, delay));
  }

  if (positions.length < 2) return false;

  let totalDelta = 0;
  for (let i = 1; i < positions.length; i++) {
    totalDelta += Math.abs(positions[i] - positions[i - 1]);
  }

  const avgMovement = totalDelta / (positions.length - 1);
  return avgMovement > 10; // 흔들림이 크면 true
}