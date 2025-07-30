# BE_TeacherCan_2 프로젝트 구조 문서

## 📋 프로젝트 개요

- **프로젝트명**: TeacherCan 백엔드 서버
- **프레임워크**: NestJS (TypeScript)
- **데이터베이스**: MySQL + TypeORM
- **캐시**: Redis
- **인증**: 카카오 OAuth + JWT + 세션
- **포트**: 8080
- **배포**: Docker + Google Cloud Run

## 🏗️ 전체 디렉토리 구조

```
BE_TeacherCan_2/
├── src/                        # 소스 코드
│   ├── main.ts                 # 애플리케이션 진입점
│   ├── app.module.ts           # 루트 모듈
│   ├── auth/                   # 인증 관련 모듈
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── role.guard.ts
│   │   ├── kakao.strategy.ts
│   │   ├── session.service.ts
│   │   ├── oauth.service.ts
│   │   ├── authentication.service.ts
│   │   ├── auth.module.ts
│   │   └── auth.types.ts
│   ├── config/                 # 설정 파일들
│   │   └── constants.ts
│   ├── db/                     # 데이터베이스 관련
│   │   ├── AppDataSource.ts    # TypeORM 데이터소스 설정
│   │   └── entities/           # 엔티티 정의
│   │       ├── user.entity.ts
│   │       ├── student.entity.ts
│   │       ├── music.entity.ts
│   │       ├── room.entity.ts
│   │       ├── session.entity.ts
│   │       └── rsaKey.entity.ts
│   ├── dto/                    # Data Transfer Objects
│   │   ├── user.dto.ts
│   │   ├── music.dto.ts
│   │   ├── question.dto.ts
│   │   ├── response.dto.ts
│   │   └── session.dto.ts
│   ├── evaluation/             # AI 평가 관련 모듈
│   │   ├── evaluation.controller.ts
│   │   ├── evaluation.service.ts
│   │   ├── evaluation.module.ts
│   │   ├── session-store.service.ts
│   │   └── session-stream.service.ts
│   ├── music/                  # 음악 관련 모듈
│   │   ├── music.controller.ts
│   │   ├── music.service.ts
│   │   ├── music.module.ts
│   │   └── music.sql.service.ts
│   ├── redis/                  # Redis 관련 모듈
│   │   ├── redis.service.ts
│   │   ├── redis.module.ts
│   │   ├── redis-stream.service.ts
│   │   └── redisPubSub.service.ts
│   ├── services/               # 공통 서비스
│   │   ├── crypto.service.ts
│   │   └── crypto.module.ts
│   ├── decorator/              # 커스텀 데코레이터
│   │   ├── user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── interceptor/            # 인터셉터 (CSRF 등)
│   │   ├── csrf.interceptor.ts
│   │   └── cookie.interceptor.ts
│   └── middleware/             # 미들웨어
│       └── csrf.middleware.ts
├── docs/                       # 문서 디렉토리
├── exam/                       # 시험 관련 정적 파일
│   ├── main.js
│   └── main.html
├── nginx/                      # Nginx 설정 파일
│   ├── default.conf
│   ├── default-http.conf
│   ├── default-ssl.conf
│   └── start.sh
├── dist/                       # 빌드 결과물
├── test/                       # 테스트 파일
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
├── docker-compose.yml          # Docker Compose 설정
├── Dockerfile                  # Docker 이미지 빌드
├── package.json                # 프로젝트 의존성
├── tsconfig.json               # TypeScript 설정
├── nest-cli.json              # NestJS CLI 설정
├── cloudbuild.yaml            # Google Cloud Build 설정
└── 기타 설정 파일들
```

## 🔧 주요 기술 스택

### 백엔드 프레임워크
- **NestJS 10.x**: 메인 프레임워크
- **TypeScript 5.1.3**: 프로그래밍 언어
- **Express**: 기본 HTTP 서버

### 데이터베이스 & ORM
- **MySQL**: 주 데이터베이스 (mysql2 3.12.0 드라이버)
- **TypeORM**: ORM 라이브러리
- **Redis**: 캐시 및 세션 저장소 (ioredis 5.6.1)

### 인증 & 보안
- **Passport.js**: 인증 프레임워크
- **카카오 OAuth**: 소셜 로그인 (passport-kakao 1.0.1)
- **JWT**: 토큰 기반 인증 (jsonwebtoken 9.0.2)
- **Express Session**: 세션 관리 (express-session 1.18.1)
- **CSRF Protection**: CSRF 공격 방지
- **Cookie Parser**: 쿠키 처리 (cookie-parser 1.4.7)

### API & 문서화
- **Swagger**: API 문서 자동 생성 (@nestjs/swagger 7.4.2)
- **Class Validator**: DTO 유효성 검사 (class-validator 0.14.1)
- **Class Transformer**: 데이터 변환 (class-transformer 0.5.1)

### 기타 라이브러리
- **Axios**: HTTP 클라이언트 (axios 1.8.0, @nestjs/axios 4.0.0)
- **tiktoken**: AI 토큰 처리 (tiktoken 1.0.20)
- **Cron Scheduling**: 작업 스케줄링 (@nestjs/schedule 6.0.0)
- **Serve Static**: 정적 파일 서빙 (@nestjs/serve-static 4.0.2)

## 📁 핵심 모듈 상세 분석

### 1. 인증 모듈 (auth/)
```
auth/
├── auth.controller.ts      # 로그인, 로그아웃 등 인증 API
├── auth.service.ts         # 인증 비즈니스 로직
├── auth.guard.ts           # 전역 인증 가드
├── role.guard.ts           # 역할 기반 접근 제어
├── kakao.strategy.ts       # 카카오 OAuth 전략
├── session.service.ts      # 세션 관리 서비스
├── oauth.service.ts        # OAuth 처리 서비스
├── authentication.service.ts # 인증 처리 로직
├── auth.module.ts          # 인증 모듈 정의
└── auth.types.ts           # 인증 관련 타입 정의
```

**주요 기능:**
- 카카오 OAuth 소셜 로그인
- JWT 토큰 생성 및 검증
- 세션 기반 인증
- 역할 기반 접근 제어 (RBAC)

### 2. 평가 모듈 (evaluation/)
```
evaluation/
├── evaluation.controller.ts    # AI 평가 API 엔드포인트
├── evaluation.service.ts       # 평가 로직 및 AI 처리
├── evaluation.module.ts        # 평가 모듈 정의
├── session-store.service.ts    # 평가 세션 저장소
└── session-stream.service.ts   # 실시간 세션 스트림 처리
```

**주요 기능:**
- AI 기반 학습 평가
- tiktoken을 사용한 토큰 처리
- 실시간 평가 세션 관리
- 평가 결과 저장 및 조회

### 3. 음악 모듈 (music/)
```
music/
├── music.controller.ts     # 음악 관련 API
├── music.service.ts        # 음악 비즈니스 로직
├── music.module.ts         # 음악 모듈 정의
└── music.sql.service.ts    # 음악 데이터베이스 서비스
```

**주요 기능:**
- 음악 메타데이터 관리
- 음악 파일 처리
- 음악 관련 CRUD 작업

### 4. Redis 모듈 (redis/)
```
redis/
├── redis.service.ts           # 기본 Redis 서비스
├── redis.module.ts            # Redis 모듈 정의
├── redis-stream.service.ts    # Redis Stream 처리
└── redisPubSub.service.ts     # Redis Pub/Sub 서비스
```

**주요 기능:**
- Redis 캐시 및 세션 저장소
- Redis Stream을 통한 실시간 데이터 처리
- Pub/Sub 패턴을 통한 메시지 브로드캐스팅
- ioredis 라이브러리 사용

### 5. 데이터베이스 엔티티 (db/entities/)
```
entities/
├── user.entity.ts         # 사용자 정보
├── student.entity.ts      # 학생 정보
├── music.entity.ts        # 음악 정보
├── room.entity.ts         # 방/세션 정보
├── session.entity.ts      # 세션 정보
└── rsaKey.entity.ts       # RSA 암호화 키
```

**데이터 모델 관계:**
- User ↔ Student (일대다)
- Room ↔ Session (일대다)
- User ↔ Session (일대다)
- Music ↔ Evaluation (연관 관계)

### 6. 커스텀 데코레이터 (decorator/)
```
decorator/
├── user.decorator.ts      # 사용자 정보 추출 데코레이터
└── roles.decorator.ts     # 역할 기반 접근 제어 데코레이터
```

**주요 기능:**
- 컨트롤러에서 사용자 정보 자동 추출
- 역할 기반 권한 제어 메타데이터 설정

### 7. 인터셉터 (interceptor/)
```
interceptor/
├── csrf.interceptor.ts    # CSRF 보호 인터셉터
└── cookie.interceptor.ts  # 쿠키 처리 인터셉터
```

**주요 기능:**
- CSRF 토큰 검증 및 보호
- 쿠키 기반 인증 처리

### 8. 미들웨어 (middleware/)
```
middleware/
└── csrf.middleware.ts     # CSRF 보호 미들웨어
```

**주요 기능:**
- CSRF 공격 방지를 위한 미들웨어
- 요청 검증 및 토큰 처리

### 9. DTO (Data Transfer Objects)
```
dto/
├── user.dto.ts           # 사용자 데이터 전송 객체
├── music.dto.ts          # 음악 데이터 전송 객체
├── question.dto.ts       # 질문 데이터 전송 객체
├── response.dto.ts       # 응답 데이터 전송 객체
└── session.dto.ts        # 세션 데이터 전송 객체
```

**기능:**
- API 요청/응답 데이터 구조 정의
- 데이터 유효성 검증
- 타입 안전성 보장

### 10. 시험 시스템 (exam/)
```
exam/
├── main.js               # 시험 시스템 메인 로직
└── main.html             # 시험 시스템 프론트엔드
```

**주요 기능:**
- 온라인 시험 시스템
- 정적 파일 기반 시험 인터페이스
- JavaScript 기반 시험 로직 처리

## 🔒 보안 기능

### 인증 및 권한
- **다중 인증 가드**: AuthGuard + RolesGuard
- **카카오 OAuth**: 소셜 로그인 통합
- **JWT 토큰**: 상태 없는 인증
- **세션 관리**: 서버 사이드 세션

### 보안 미들웨어
- **CSRF 보호**: 미들웨어 + 인터셉터
- **CORS 설정**: 허용된 도메인만 접근
- **쿠키 보안**: HttpOnly, Secure 플래그

### 암호화
- **RSA 키 관리**: 비대칭 암호화
- **암호화 서비스**: 데이터 암호화/복호화

## 🌐 API 문서화

### Swagger 설정
- **경로**: `/api-docs` (로컬 환경만)
- **인증**: 쿠키 기반 인증 지원
- **자동 생성**: 데코레이터 기반 문서 자동 생성

### API 엔드포인트 구조
```
/auth/*        # 인증 관련 API
/music/*       # 음악 관련 API
/evaluation/*  # 평가 관련 API
/api-docs      # Swagger 문서 (로컬만)
```

## 🐳 배포 및 인프라

### Docker 설정
- **Dockerfile**: 멀티 스테이지 빌드
- **docker-compose.yml**: 로컬 개발 환경
- **의존성**: MySQL, Redis 컨테이너

### 클라우드 배포
- **Google Cloud Build**: 자동 빌드 및 배포
- **cloudbuild.yaml**: 빌드 파이프라인 정의
- **Nginx**: 리버스 프록시 설정
  - **nginx/default.conf**: 기본 설정
  - **nginx/default-http.conf**: HTTP 설정
  - **nginx/default-ssl.conf**: SSL 설정
  - **nginx/start.sh**: Nginx 시작 스크립트

### SSL/HTTPS
- **로컬 개발**: 자체 서명 인증서 (./ssl/localhost-key.pem, ./ssl/localhost.pem)
- **프로덕션**: 도메인 인증서 (teachercan.com)

## 🔧 개발 환경 설정

### 필수 환경 변수
```bash
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=mydatabase
LOCAL=true                    # 로컬 개발 모드
LOCAL_HTTPS=true             # HTTPS 활성화
PORT=8080                    # 서버 포트
```

### 개발 명령어
```bash
npm run start:dev            # 개발 서버 시작
npm run build               # 프로덕션 빌드 (exam 파일 포함)
npm run test                # 테스트 실행
npm run test:e2e            # E2E 테스트 실행
npm run lint                # 코드 린팅
npm run format              # 코드 포맷팅
```

## 📊 주요 기능 추정

### 교육 플랫폼 기능
1. **사용자 관리**: 교사/학생 계정 관리
2. **카카오 로그인**: 간편 소셜 로그인
3. **AI 평가 시스템**: 자동 학습 평가
4. **음악 교육**: 음악 관련 콘텐츠 관리
5. **실시간 세션**: 라이브 수업 지원
6. **시험 시스템**: 온라인 시험 관리

### 기술적 특징
- **확장 가능한 아키텍처**: 모듈화된 구조
- **높은 보안성**: 다중 보안 레이어
- **실시간 처리**: 스트림 기반 세션
- **클라우드 네이티브**: 컨테이너 기반 배포
- **HTTPS 지원**: 로컬 및 프로덕션 환경에서 SSL/TLS

## 🔄 데이터 흐름

1. **사용자 로그인** → 카카오 OAuth → JWT 토큰 발급
2. **API 요청** → 인증 가드 → 권한 검증 → 비즈니스 로직
3. **평가 요청** → AI 처리 → 결과 저장 → 실시간 응답
4. **세션 관리** → Redis 캐시 → 데이터베이스 동기화

## 🚀 서버 시작 프로세스

### HTTPS 모드 (로컬 개발)
1. SSL 인증서 파일 확인 (./ssl/localhost-key.pem, ./ssl/localhost.pem)
2. LOCAL_HTTPS=true 환경변수 설정
3. 서버 시작 시 HTTPS 모드로 실행

### HTTP 모드 (기본)
1. LOCAL_HTTPS=false 또는 미설정
2. HTTP 모드로 서버 실행

### CORS 설정
- 허용된 도메인: localhost:3000, teachercan.com, www.teachercan.com
- Credentials 지원
- CSRF 토큰 헤더 허용

---

**작성일**: 2025-06-24  
**버전**: 2.0  
**작성자**: AI Assistant  
**최종 업데이트**: 2025-01-27  
**업데이트 내용**: 
- 최신 main 브랜치 정보 반영
- package.json 의존성 버전 업데이트
- main.ts의 HTTPS/HTTP 모드 설정 추가
- app.module.ts의 전역 가드 및 인터셉터 설정 반영
- 빌드 스크립트에 exam 파일 복사 로직 추가
- CORS 설정 상세 정보 추가
- 서버 시작 프로세스 섹션 추가
