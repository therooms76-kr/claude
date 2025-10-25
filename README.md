# 보험 전화 청약 시스템

전화를 통해 보험을 청약하는 프로세스를 자동으로 녹음, 전사(STT), 검증하고 관리자에게 이메일로 결과를 발송하는 시스템입니다.

## 주요 기능

1. **통화 녹음** - 브라우저에서 직접 녹음하거나 녹음 파일 업로드
2. **음성-텍스트 변환 (STT)** - OpenAI Whisper API를 사용한 한국어 음성 전사
3. **청약 프로세스 검증** - Claude API를 통한 보험 청약 절차 자동 검증
4. **자동 이메일 발송** - 검증 결과를 관리자에게 자동으로 이메일 발송
5. **통화 기록 관리** - 모든 통화 및 검증 이력 저장 및 조회

## 기술 스택

### 백엔드
- Node.js + Express
- SQLite (데이터베이스)
- OpenAI API (Whisper STT)
- Anthropic API (Claude 검증)
- Nodemailer (이메일 발송)

### 프론트엔드
- HTML5 + CSS3 + JavaScript
- Web Audio API (브라우저 녹음)
- Fetch API (REST API 통신)

## 설치 및 실행

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정

`backend/.env.example` 파일을 참고하여 `backend/.env` 파일을 생성하고 API 키를 설정합니다.

```bash
cp backend/.env.example backend/.env
```

`.env` 파일 내용:

```env
PORT=3000

# OpenAI API Key (Whisper STT용)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic API Key (Claude API용)
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# 이메일 설정 (Gmail 예시)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# 관리자 이메일
ADMIN_EMAIL=admin@company.com

# 데이터베이스
DB_PATH=./database.sqlite
```

#### API 키 발급 방법

**OpenAI API Key:**
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 생성된 키를 복사하여 `.env` 파일에 입력

**Anthropic API Key:**
1. https://console.anthropic.com/settings/keys 접속
2. "Create Key" 클릭
3. 생성된 키를 복사하여 `.env` 파일에 입력

**Gmail 앱 비밀번호:**
1. Google 계정 설정 > 보안 > 2단계 인증 활성화
2. 앱 비밀번호 생성 (https://myaccount.google.com/apppasswords)
3. 생성된 비밀번호를 `.env` 파일에 입력

### 3. 서버 실행

```bash
cd backend
npm start
```

개발 모드 (자동 재시작):
```bash
npm run dev
```

### 4. 웹 브라우저 접속

```
http://localhost:3000
```

## 사용 방법

### 방법 1: 브라우저에서 직접 녹음
1. "녹음 시작" 버튼 클릭 (마이크 권한 허용)
2. 통화 진행
3. "녹음 중지" 버튼 클릭
4. "자동 처리" 버튼 클릭

### 방법 2: 녹음 파일 업로드
1. "녹음 파일 업로드" 섹션에서 파일 선택
2. "자동 처리" 버튼 클릭

### 자동 처리 프로세스
"자동 처리" 버튼을 클릭하면 다음 단계가 자동으로 실행됩니다:

1. 파일 업로드 및 저장
2. OpenAI Whisper를 통한 음성-텍스트 변환
3. Claude API를 통한 청약 프로세스 검증
4. 관리자에게 검증 결과 이메일 발송

## 청약 프로세스 검증 기준

시스템은 다음 6단계가 올바르게 진행되었는지 검증합니다:

1. ✅ 고객 신원 확인 (이름, 생년월일, 연락처)
2. ✅ 보험 상품 설명 (보험 종류, 보장 내용, 보험료)
3. ✅ 건강 상태 확인 (기저질환, 현재 복용 중인 약)
4. ✅ 수익자 정보 확인
5. ✅ 약관 동의 확인 (개인정보 처리 동의, 보험 약관 동의)
6. ✅ 최종 확인 및 청약 완료

### 검증 결과
- **정상**: 모든 절차가 올바르게 진행됨
- **비정상**: 누락되거나 잘못된 절차가 있음 (관리자에게 경고 이메일 발송)

## API 엔드포인트

### 전체 프로세스 자동 실행
```
POST /api/calls/process
Content-Type: multipart/form-data

Body: { audio: [File] }
```

### 개별 단계 실행
```
# 1. 파일 업로드
POST /api/calls/upload
Body: { audio: [File] }

# 2. STT 변환
POST /api/calls/:callId/transcribe

# 3. 프로세스 검증
POST /api/calls/:callId/validate

# 4. 이메일 발송
POST /api/calls/:callId/email

# 통화 목록 조회
GET /api/calls

# 특정 통화 조회
GET /api/calls/:callId
```

## 프로젝트 구조

```
insurance-call-system/
├── backend/
│   ├── src/
│   │   ├── config/          # 환경 설정
│   │   │   ├── database.js  # SQLite 설정
│   │   │   └── env.js       # 환경 변수
│   │   ├── controllers/     # 컨트롤러
│   │   │   └── callController.js
│   │   ├── services/        # 비즈니스 로직
│   │   │   ├── sttService.js       # OpenAI STT
│   │   │   ├── claudeService.js    # Claude 검증
│   │   │   └── emailService.js     # 이메일 발송
│   │   ├── routes/          # 라우팅
│   │   │   └── callRoutes.js
│   │   └── index.js         # 서버 진입점
│   ├── package.json
│   ├── .env.example
│   └── database.sqlite      # SQLite DB (자동 생성)
├── frontend/
│   ├── index.html           # 메인 페이지
│   ├── css/
│   │   └── styles.css       # 스타일시트
│   └── js/
│       ├── recorder.js      # 녹음 기능
│       └── app.js           # 애플리케이션 로직
├── uploads/                 # 업로드된 파일 저장
├── .gitignore
└── README.md
```

## 데이터베이스 스키마

### calls 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | UUID (Primary Key) |
| file_path | TEXT | 업로드된 파일 경로 |
| file_name | TEXT | 원본 파일명 |
| uploaded_at | DATETIME | 업로드 시간 |
| transcription | TEXT | STT 변환 텍스트 |
| transcribed_at | DATETIME | STT 변환 시간 |
| validation_status | TEXT | 검증 상태 (정상/비정상) |
| validation_result | TEXT | 검증 결과 (JSON) |
| validated_at | DATETIME | 검증 시간 |
| email_sent | INTEGER | 이메일 발송 여부 (0/1) |
| email_sent_at | DATETIME | 이메일 발송 시간 |

## 보안 고려사항

1. **API 키 보안**: `.env` 파일은 절대 Git에 커밋하지 마세요
2. **파일 업로드 제한**: 50MB 이하의 오디오 파일만 허용
3. **이메일 인증**: Gmail 앱 비밀번호 사용 권장
4. **HTTPS**: 프로덕션 환경에서는 HTTPS 사용 필수

## 문제 해결

### OpenAI API 오류
- API 키가 올바른지 확인
- 계정에 크레딧이 충분한지 확인

### Claude API 오류
- API 키가 올바른지 확인
- 모델 접근 권한 확인

### 이메일 발송 실패
- Gmail 2단계 인증 활성화 확인
- 앱 비밀번호 정확성 확인
- 방화벽에서 SMTP 포트(587) 허용 확인

### 녹음 안됨
- 브라우저 마이크 권한 확인
- HTTPS 환경에서만 작동 (localhost는 예외)

## 라이선스

MIT License

## 개발자

보험 전화 청약 시스템 v1.0.0
