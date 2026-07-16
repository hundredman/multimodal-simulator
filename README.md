# Multimodal Interview Simulator

음성 답변과 얼굴 표정을 함께 분석하는 한국어·영어 지원 브라우저 기반 AI 면접 시뮬레이터입니다.

## Features

- 한국어와 영어 면접 질문
- Web Speech API 기반 답변 인식
- face-api.js 기반 얼굴 표정 분석
- 답변 길이와 표정 정보를 조합한 피드백

## Run Locally

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 열고 카메라와 마이크 사용을 허용합니다.

## Browser Requirements

- Web Speech API를 지원하는 Chrome 계열 브라우저를 권장합니다.
- 카메라와 마이크 접근을 위해 HTTPS 또는 localhost 환경이 필요합니다.
- 브라우저와 운영체제에 따라 음성 인식 지원 범위가 다를 수 있습니다.

## Structure

- `index.html` — 사용자 인터페이스
- `app.js` — 질문, 음성 인식, 표정 분석 로직
- `styles.css` — 화면 스타일
- `models/` — face-api.js 모델 파일

## Notice

이 프로젝트는 학습용 프로토타입이며 실제 채용 평가 도구가 아닙니다.
