// 면접 시뮬레이터: 음성 + 표정 + 행동 피드백 제공
const questions = [
  "자기소개를 해주세요.",
  "최근에 도전한 경험에 대해 말해주세요.",
  "갈등을 해결한 경험이 있나요?",
  "지원한 이유는 무엇인가요?"
];

// face-api.js 로드
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(console.error);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'ko-KR';
recognition.interimResults = false;

const startBtn = document.getElementById("startBtn");
const prompt = document.getElementById("prompt");
const feedbackDiv = document.getElementById("feedback");
const questionBox = document.getElementById("questionBox");

startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  feedbackDiv.innerText = "";
  const q = pickQuestion();
  questionBox.innerText = `면접 질문: ${q}`;
  prompt.innerText = "답변을 시작해주세요...";
  recognition.start();
});

recognition.onresult = async (e) => {
  const text = e.results[0][0].transcript;
  prompt.innerText = "답변 분석 중...";

  const expr = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
  const happyScore = expr?.expressions.happy || 0;

  const nodded = await observeGesture();

  let feedback = `당신의 답변: "${text}"\n`;
  if (text.length < 10) feedback += "답변이 너무 짧습니다. 조금 더 구체적으로 이야기해보세요.\n";
  else feedback += "구체적인 답변 감사합니다.\n";

  if (/열정|책임감|도전|성장|협업/.test(text)) {
    feedback += "지원자의 태도와 강점이 잘 드러났습니다.\n";
  } else {
    feedback += "조금 더 자신만의 경험과 강점을 녹여보세요.\n";
  }

  if (happyScore > 0.6) feedback += "표정이 긍정적으로 보입니다.\n";
  else feedback += "좀 더 밝은 표정을 시도해보세요.\n";

  feedback += nodded ? "고개를 잘 끄덕였습니다." : "고개 끄덕임이 부족했어요.";

  provideFeedback(feedback);
  resetUI();
};

function pickQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}

function provideFeedback(msg) {
  feedbackDiv.innerText = msg;
  const utter = new SpeechSynthesisUtterance(msg);
  utter.lang = 'ko-KR';
  speechSynthesis.speak(utter);
}

function resetUI() {
  startBtn.style.display = "inline-block";
  prompt.innerText = "Start 버튼을 눌러 다음 질문을 받아보세요.";
}

// 끄덕임 감지
let yHistory = [];
async function observeGesture() {
  return new Promise((resolve) => {
    yHistory = [];
    const start = performance.now();
    const duration = 3000;

    const interval = setInterval(async () => {
      const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
      if (result?.box) yHistory.push(result.box.top);
      if (performance.now() - start > duration) {
        clearInterval(interval);
        const delta = Math.max(...yHistory) - Math.min(...yHistory);
        resolve(delta > 20);
      }
    }, 150);
  });
}