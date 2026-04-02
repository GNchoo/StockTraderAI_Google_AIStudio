<div align="center">

# 📈 StockTrader AI

### Google AI Studio 기반 한국 주식 자동매매 시스템

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![KIS API](https://img.shields.io/badge/KIS_API-한국투자증권-FF6B00?style=for-the-badge)](https://apiportal.koreainvestment.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> RSI · MACD 기술적 지표와 Google Gemini AI 감성 분석을 결합한
> 한국 주식시장(KOSPI) 자동매매 웹 애플리케이션

<br/>

[🚀 빠른 시작](#-설치-방법) · [📖 사용법](#-사용법) · [🔑 API 설정](#-kis-api-설정-가이드) · [🧠 매매 전략](#-매매-전략)

</div>

---

## 📋 목차

- [✨ 주요 기능](#-주요-기능)
- [🖥️ 화면 구성](#️-화면-구성)
- [🛠️ 기술 스택](#️-기술-스택)
- [⚙️ 설치 방법](#️-설치-방법)
- [🔑 환경 변수 설정](#-환경-변수-설정)
- [🚀 KIS API 설정 가이드](#-kis-api-설정-가이드)
- [📖 사용법](#-사용법)
- [🧠 매매 전략](#-매매-전략)
- [📁 프로젝트 구조](#-프로젝트-구조)
- [⚠️ 주의사항](#️-주의사항)

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🤖 **AI 감성 분석** | Google Gemini Flash 모델로 뉴스 헤드라인의 긍/부정 감성을 분석하여 매매 신호에 반영 |
| 📊 **기술적 지표** | RSI, MACD, SMA, EMA를 계산해 과매수/과매도 구간 자동 감지 |
| 🏦 **KIS API 연동** | 한국투자증권 Open API를 통한 실시간 시세 조회 및 주문 체결 |
| 🧪 **모의/실전 모드** | 모의투자 계좌로 안전하게 전략을 테스트한 후 실전 전환 |
| 📈 **실시간 대시보드** | Recharts 기반 수익률 차트, 포트폴리오 현황, 매매 로그 실시간 표시 |
| 🛡️ **Mock 모드** | API 키 없이도 합성 데이터로 시스템 동작 확인 가능 |
| ⚡ **10초 주기 자동매매** | 설정된 전략에 따라 10초마다 신호를 감지하고 자동으로 주문 실행 |

---

## 🖥️ 화면 구성

```
┌─────────────────────────────────────────────────────────┐
│  📈 StockTrader AI          [Virtual ▾]  ● ACTIVE  [■]  │
├─────────────────┬───────────────────────────────────────┤
│                 │                                        │
│  💰 잔고        │  📊 수익률 차트                         │
│  ₩9,850,000     │  ████████████████▓▓▒░                 │
│                 │                                        │
│  📦 포트폴리오  │  📋 매매 로그                           │
│  005930 x 5     │  [BUY]  삼성전자 x5 @ ₩78,500         │
│  035420 x 3     │  [SELL] 네이버 x3 @ ₩215,000           │
│                 │  [HOLD] SK하이닉스                      │
└─────────────────┴───────────────────────────────────────┘
```

---

## 🛠️ 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| **프론트엔드** | React + TypeScript | 19 / 5.8 |
| **스타일링** | Tailwind CSS + Motion | 4 / 12 |
| **차트** | Recharts | 3.8 |
| **백엔드** | Express.js | 4.21 |
| **빌드** | Vite + esbuild | 6.2 / 0.27 |
| **AI 분석** | Google Gemini Flash | @google/genai ^1.29 |
| **증권사 API** | 한국투자증권 KIS Open API | REST / WebSocket |
| **HTTP 클라이언트** | Axios | 1.13 |

---

## ⚙️ 설치 방법

### 사전 요구사항

- **Node.js** 18.0.0 이상
- **npm** 9.0.0 이상
- **한국투자증권 계좌** (모의투자 또는 실전투자)
- **Google AI Studio API 키** ([발급 링크](https://aistudio.google.com/apikey))

### 1. 저장소 클론

```bash
git clone https://github.com/GNchoo/StockTraderAI_Google_AIStudio.git
cd StockTraderAI_Google_AIStudio
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env
```

`.env` 파일을 열어 아래 항목을 채워주세요. (자세한 내용은 [환경 변수 설정](#-환경-변수-설정) 참고)

### 4. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 접속

---

## 🔑 환경 변수 설정

`.env` 파일에 아래 변수들을 설정합니다.

```env
# ─── KIS 실전투자 API 키 ───────────────────────────────
KIS_REAL_APP_KEY=여기에_실전투자_앱키_입력
KIS_REAL_APP_SECRET=여기에_실전투자_시크릿_입력
KIS_REAL_CANO=계좌번호_앞8자리
KIS_REAL_ACNT_PRDT_CD=01

# ─── KIS 모의투자 API 키 ───────────────────────────────
KIS_VIRTUAL_APP_KEY=여기에_모의투자_앱키_입력
KIS_VIRTUAL_APP_SECRET=여기에_모의투자_시크릿_입력
KIS_VIRTUAL_CANO=모의투자_계좌번호_앞8자리
KIS_VIRTUAL_ACNT_PRDT_CD=01

# ─── 실행 모드 ─────────────────────────────────────────
KIS_MODE=virtual                  # "virtual" 또는 "real"

# ─── 매매 설정 ─────────────────────────────────────────
INITIAL_CAPITAL=10000000          # 초기 자본금 (10,000,000원)
RISK_PER_TRADE=0.02               # 거래당 리스크 (2%)
STOP_LOSS_PERCENT=0.05            # 손절 기준 (5%)
TAKE_PROFIT_PERCENT=0.10          # 익절 기준 (10%)

# ─── AI / 배포 ─────────────────────────────────────────
GEMINI_API_KEY=여기에_Gemini_API키_입력
APP_URL=http://localhost:3000
```

### 환경 변수 설명

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `KIS_VIRTUAL_APP_KEY` | ✅ (모의투자) | KIS 개발자 포털에서 발급한 모의투자용 앱 키 |
| `KIS_VIRTUAL_APP_SECRET` | ✅ (모의투자) | KIS 모의투자용 앱 시크릿 |
| `KIS_VIRTUAL_CANO` | ✅ (모의투자) | 모의투자 계좌번호 앞 8자리 |
| `KIS_REAL_APP_KEY` | ✅ (실전투자) | KIS 실전투자용 앱 키 (실전 모드 시 필수) |
| `KIS_REAL_APP_SECRET` | ✅ (실전투자) | KIS 실전투자용 앱 시크릿 |
| `KIS_REAL_CANO` | ✅ (실전투자) | 실전투자 계좌번호 앞 8자리 |
| `KIS_MODE` | ✅ | 실행 모드 — `virtual` 또는 `real` |
| `GEMINI_API_KEY` | ✅ | Google AI Studio에서 발급한 Gemini API 키 |
| `INITIAL_CAPITAL` | ⬜ | 시뮬레이션 초기 자본금 (기본: 10,000,000원) |

> ⚠️ **보안 주의**: `.env` 파일은 절대 git에 커밋하지 마세요. `.gitignore`에 포함되어 있습니다.

---

## 🚀 KIS API 설정 가이드

### 1단계 — 한국투자증권 계좌 개설

1. [한국투자증권 홈페이지](https://www.koreainvestment.com) 접속
2. 비대면 계좌 개설 진행 (실전투자 또는 모의투자 선택 가능)

### 2단계 — KIS 개발자 포털 가입

1. [KIS Developers 포털](https://apiportal.koreainvestment.com) 접속
2. 회원가입 후 로그인
3. **"앱 등록"** 메뉴에서 새 앱 생성

### 3단계 — API 키 발급

```
KIS Developers → 내 앱 → 앱 등록
→ 앱 이름 입력 → 서비스 선택 (국내주식 / 모의투자)
→ 등록 완료 → App Key / App Secret 확인
```

> ⚠️ **중요**: 실전투자 키와 모의투자 키는 **별도로 발급**받아야 합니다.
> 실전투자 키를 모의투자 모드에 사용하면 `403 EGW00103` 오류가 발생합니다.

### 4단계 — 모의투자 계좌 개설

1. 한국투자증권 앱 → **모의투자** 메뉴
2. 모의투자 계좌 개설 신청
3. 발급된 모의투자 계좌번호 앞 8자리를 `KIS_VIRTUAL_CANO`에 입력

### 5단계 — Open API 서비스 신청

1. KIS Developers → **API 서비스 신청**
2. 사용할 API 항목 체크 후 신청 (승인까지 최대 1영업일)

---

## 📖 사용법

### 개발 모드 실행

```bash
npm run dev
```

### 프로덕션 빌드 & 실행

```bash
npm run build    # 프론트엔드 + 백엔드 빌드
npm start        # 프로덕션 서버 시작
```

### 모의투자로 안전하게 테스트하기

1. `.env`에서 `KIS_MODE=virtual` 설정 확인
2. `KIS_VIRTUAL_*` 변수 모두 입력
3. 서버 시작 후 대시보드에서 **[▶ Start]** 버튼 클릭
4. 매매 로그 패널에서 매매 신호 확인

### 실전 투자 전환

```
대시보드 상단 → [Virtual ▾] 버튼 → "Real" 선택
```

또는 `.env`에서 `KIS_MODE=real`로 변경 후 재시작

### REST API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/status` | 엔진 상태, 잔고, 포트폴리오, 로그 조회 |
| `POST` | `/api/toggle` | 자동매매 시작 / 정지 토글 |
| `POST` | `/api/mode` | 모드 전환 (`{ "mode": "virtual" \| "real" }`) |
| `GET` | `/api/performance` | 시간대별 수익률 데이터 조회 |

---

## 🧠 매매 전략

본 시스템은 **기술적 지표 + AI 감성 분석**의 복합 신호를 사용합니다.

### 관심 종목

| 종목코드 | 종목명 | 시장 |
|----------|--------|------|
| `005930` | 삼성전자 | KOSPI |
| `000660` | SK하이닉스 | KOSPI |
| `035420` | 네이버 | KOSPI |
| `035720` | 카카오 | KOSPI |

### 매수 조건 (3가지 모두 충족 시)

```
RSI < 35 (과매도 구간)
AND MACD > Signal (골든크로스)
AND AI 감성 점수 > 0.2 (긍정적 뉴스)
```

### 매도 조건 (3가지 모두 충족 시)

```
RSI > 65 (과매수 구간)
AND MACD < Signal (데드크로스)
AND AI 감성 점수 < -0.2 (부정적 뉴스)
```

### 포지션 관리

| 항목 | 값 |
|------|-----|
| 1회 매수 한도 | 잔고의 **10%** |
| 주문 유형 | 시장가 주문 |
| 조회 주기 | 10초마다 |
| 사용 지표 | RSI(14일), MACD(12/26/9일) |

### AI 감성 분석

- **사용 모델**: Google Gemini Flash
- **입력**: 종목 코드 + 뉴스 헤드라인
- **출력**: 감성 점수 (-1.0 ~ +1.0), 요약, BUY/SELL/HOLD 추천

---

## 📁 프로젝트 구조

```
StockTraderAI_Google_AIStudio/
│
├── src/
│   ├── App.tsx              # 메인 대시보드 UI (React)
│   ├── main.tsx             # React 진입점
│   ├── index.css            # 글로벌 스타일
│   └── lib/
│       ├── engine.ts        # 매매 엔진 (전략 실행, 포트폴리오 관리)
│       ├── kis.ts           # KIS API 브로커 (인증, 시세, 주문)
│       ├── ai.ts            # Google Gemini AI 감성 분석
│       └── indicators.ts    # 기술적 지표 (RSI, MACD, SMA, EMA)
│
├── server.ts                # Express 백엔드 서버
├── vite.config.ts           # Vite 빌드 설정
├── tsconfig.json            # TypeScript 설정
├── package.json             # 의존성 및 스크립트
├── index.html               # HTML 진입점
├── .env.example             # 환경 변수 템플릿
└── README.md                # 이 파일
```

---

## ⚠️ 주의사항

> **본 소프트웨어는 교육 및 연구 목적으로 제작되었습니다.**

- 📌 **실전 투자 전** 반드시 모의투자 모드로 충분히 테스트하세요.
- 📌 자동매매 시스템은 **손실을 보장하지 않습니다.** 모든 투자 손익에 대한 책임은 사용자 본인에게 있습니다.
- 📌 `GEMINI_API_KEY`와 `KIS_*` 키는 **절대 외부에 노출하지 마세요.** GitHub 등 공개 저장소에 커밋하면 즉시 무효화 및 재발급이 필요합니다.
- 📌 KIS API에는 **호출 빈도 제한(Rate Limit)**이 있습니다. 과도한 요청 시 계정 제한이 발생할 수 있습니다.
- 📌 AccessToken은 **발급 후 24시간** 동안만 유효합니다. 서버 재시작 시 자동으로 재발급됩니다.

---

## 📜 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되셨다면 Star를 눌러주세요!**

Made with ❤️ using [Google AI Studio](https://ai.google.dev/aistudio)

</div>
