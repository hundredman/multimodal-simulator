// mode: 'emotion' (기존 감정 인식) | 'gesture' (행동 인식)
let mode = 'emotion';

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
recognition.lang = 'en-US';
recognition.interimResults = false;

const startBtn = document.getElementById("startBtn");
const prompt = document.getElementById("prompt");
const feedbackDiv = document.getElementById("feedback");
const modeSelector = document.getElementById("modeSelector");

modeSelector.addEventListener("change", (e) => {
  mode = e.target.value;
  if (mode === 'emotion') {
    prompt.innerText = 'Say: “I’m happy today.” with a smile 😊';
  } else if (mode === 'gesture') {
    prompt.innerText = 'Say: “I’m happy today.” and then nod within 3 seconds 🤸';
  }
});

startBtn.addEventListener("click", () => {
  startBtn.style.display = "none";
  prompt.innerText = "🎤 Please speak now...";
  feedbackDiv.innerText = "";
  recognition.start();
});

recognition.onresult = async (e) => {
  const text = e.results[0][0].transcript;
  prompt.innerText = "⌛ Analyzing...";

  if (mode === 'emotion') {
    const expr = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
    const happyScore = expr?.expressions.happy || 0;

    if (/i[’']?m happy/.test(text.toLowerCase()) && happyScore > 0.7) {
      provideFeedback(`Great! You said: "${text}" with a nice smile! 😊`);
    } else {
      provideFeedback("Try again: smile & say the sentence clearly.");
    }
    resetUI();
  }
  else if (mode === 'gesture') {
    prompt.innerText = "🧍 Now nod your head within 3 seconds...";
    observeGesture().then(nodded => {
      if (nodded) {
        provideFeedback("Great gesture! You nodded 👍");
      } else {
        provideFeedback("Try again: Please nod clearly next time.");
      }
      resetUI();
    });
  }
};

function provideFeedback(msg) {
  feedbackDiv.innerText = msg;
  const utter = new SpeechSynthesisUtterance(msg);
  speechSynthesis.speak(utter);
}

function resetUI() {
  startBtn.style.display = "inline-block";
  if (mode === 'emotion') {
    prompt.innerText = 'Say: “I’m happy today.” with a smile 😊';
  } else if (mode === 'gesture') {
    prompt.innerText = 'Say: “I’m happy today.” and then nod within 3 seconds 🤸';
  }
}

// 행동 인식: 끄덕임 감지용 MediaPipe
let yHistory = [];
let detecting = false;

async function observeGesture() {
  return new Promise((resolve) => {
    yHistory = [];
    detecting = true;

    const start = performance.now();
    const checkDuration = 3000; // 3초 동안 감지

    const interval = setInterval(async () => {
      const results = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
      if (results?.box) {
        yHistory.push(results.box.top);
      }

      if (performance.now() - start > checkDuration) {
        clearInterval(interval);
        detecting = false;
        const delta = Math.max(...yHistory) - Math.min(...yHistory);
        resolve(delta > 20); // Y축 이동이 20px 이상이면 끄덕임
      }
    }, 150);
  });
}