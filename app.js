// app.js (GPT + 표정 + 행동 분석 통합)

const questions = [
  "자기소개를 해주세요.",
  "최근에 도전한 경험에 대해 말해주세요.",
  "갈등을 해결한 경험이 있나요?",
  "지원한 이유는 무엇인가요?"
];

let currentQuestion = "";

// Load face-api.js models
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
const video = document.getElementById("video");

startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  feedbackDiv.innerText = "";
  currentQuestion = pickQuestion();
  questionBox.innerText = `💬 ${currentQuestion}`;
  prompt.innerText = "답변을 시작해주세요...";
  recognition.start();
});

recognition.onresult = async (e) => {
  const text = e.results[0][0].transcript;
  prompt.innerText = "답변 분석 중...";

  // 표정
  const expr = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
  const happyScore = expr?.expressions.happy || 0;

  // 끄덕임
  const nodded = await observeGesture();

  // GPT 분석
  const gpt = await gptFeedback(currentQuestion, text);

  let feedback = `답변: \"${text}\"\n`;
  feedback += `GPT 피드백: ${gpt.feedback}\n`;
  feedback += `GPT 점수: ${gpt.score}/10\n`;
  feedback += happyScore > 0.6 ? "표정: 밝음\n" : "표정: 무표정\n";
  feedback += nodded ? "행동: 고개 끄덕임 감지됨" : "행동: 끄덕임 없음";

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

async function gptFeedback(question, answer) {
  try {
    const res = await fetch("/.netlify/functions/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API error response:", errorText);
      return { feedback: "GPT API 오류", score: 0 };
    }

    const data = await res.json();
    console.log("GPT response:", data);
    return data;
  } catch (err) {
    console.error("gptFeedback error:", err);
    return { feedback: "GPT 호출 실패", score: 0 };
  }
}
