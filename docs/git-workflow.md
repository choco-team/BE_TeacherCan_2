# Git 워크플로우 및 브랜치 전략

## 🌳 브랜치 구조

```
main (프로덕션)
├── dev (개발 통합)
│   ├── feat/auth-improvement
│   ├── feat/evaluation-api-refactor
│   ├── fix/kakao-login-bug
│   └── hotfix/critical-security-fix
```

## 📝 브랜치 정책

### 브랜치 유형

| 브랜치 | 용도 | 명명 규칙 | 수명 |
|--------|------|-----------|------|
| `main` | 프로덕션 배포 | `main` | 영구 |
| `dev` | 개발 통합 | `dev` | 영구 |
| `feat/*` | 새로운 기능 개발 | `feat/기능명` | 임시 |
| `fix/*` | 버그 수정 | `fix/버그명` | 임시 |
| `hotfix/*` | 긴급 수정 | `hotfix/이슈명` | 임시 |
| `docs/*` | 문서 작업 | `docs/문서명` | 임시 |
| `refactor/*` | 리팩토링 | `refactor/대상` | 임시 |

### 브랜치별 규칙

#### 🔒 main 브랜치
- **목적**: 프로덕션 환경에 배포되는 안정적인 코드
- **보호 규칙**: 
  - 직접 push 금지
  - PR을 통해서만 병합
  - 1명 이상의 리뷰 필수
  - 모든 상태 검사 통과 필수
- **병합 소스**: `dev` 브랜치, `hotfix/*` 브랜치

#### 🔧 dev 브랜치  
- **목적**: 개발 중인 기능들의 통합 브랜치
- **보호 규칙**:
  - PR을 통해서만 병합 (선택적)
  - 리뷰 없이도 병합 가능 (팀 내부 판단)
- **병합 소스**: `feat/*`, `fix/*`, `docs/*`, `refactor/*` 브랜치

#### 🚀 feature 브랜치들
- **목적**: 개별 기능 개발
- **규칙**: 자유롭게 커밋 및 push 가능
- **병합 대상**: `dev` 브랜치

---

## 🔄 워크플로우

### 1. 일반적인 기능 개발

```bash
# 1. dev 브랜치에서 최신 코드 받기
git checkout dev
git pull origin dev

# 2. 새로운 기능 브랜치 생성
git checkout -b feat/user-profile-api

# 3. 개발 작업
# ... 코딩 ...
git add .
git commit -m "feat: 사용자 프로필 API 추가"

# 4. 원격 저장소에 push
git push origin feat/user-profile-api

# 5. GitHub에서 dev 브랜치로 PR 생성
# 6. 코드 리뷰 및 병합
# 7. 로컬 브랜치 정리
git checkout dev
git branch -d feat/user-profile-api
```

### 2. 릴리즈 배포

```bash
# 1. dev → main PR 생성
# 2. 필수 리뷰어 1명 승인
# 3. main 브랜치 병합
# 4. 배포 (Cloud Run)
```

### 3. 긴급 수정 (Hotfix)

```bash
# 1. main 브랜치에서 분기
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bug

# 2. 긴급 수정
# ... 수정 작업 ...
git commit -m "hotfix: 인증 관련 보안 취약점 수정"

# 3. main으로 PR 생성 (우선순위 높음)
# 4. 빠른 리뷰 및 병합
# 5. dev 브랜치에도 반영
git checkout dev
git merge main
```

---

## 📋 커밋 메시지 규칙

### 형식
```
<type>: <description>

[optional body]

[optional footer]
```

### 타입 분류
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (로직 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 설정, 패키지 관리 등

### 예시
```bash
feat: 카카오 로그인 API 추가
fix: 세션 만료 시 오류 처리 개선
docs: API 문서 업데이트
refactor: AuthService 코드 정리
test: 사용자 인증 테스트 추가
chore: package.json 의존성 업데이트
```

---

## 🔍 PR (Pull Request) 가이드

### PR 생성 규칙
1. **제목**: 명확하고 간결하게
2. **설명**: 변경 사항과 이유 명시
3. **리뷰어**: 적절한 팀원 지정
4. **라벨**: 필요시 라벨 추가

### PR 템플릿
```markdown
## 변경 사항 요약
- 

## 변경 이유
- 

## 테스트 방법
- [ ] 로컬 테스트 완료
- [ ] 린트 검사 통과
- [ ] 빌드 성공

## 체크리스트
- [ ] 관련 문서 업데이트
- [ ] 브레이킹 체인지 확인
- [ ] 보안 이슈 검토

## 추가 정보
- 관련 이슈: #
- 참고 자료: 
```

### 리뷰 가이드
- **코드 품질**: 가독성, 성능, 보안
- **비즈니스 로직**: 요구사항 충족 여부
- **테스트**: 테스트 커버리지 확인
- **문서**: 필요시 문서 업데이트 여부

---

## ⚙️ GitHub 저장소 설정

### 브랜치 보호 규칙

#### main 브랜치
```
Settings > Branches > Add rule

브랜치 이름: main
☑️ Require a pull request before merging
☑️ Require approvals (1명)
☑️ Dismiss stale PR approvals when new commits are pushed
☑️ Require status checks to pass before merging
☑️ Require branches to be up to date before merging
☑️ Include administrators
```

#### dev 브랜치 (선택적)
```
브랜치 이름: dev
☑️ Require a pull request before merging
☐ Require approvals (0명 - 팀 내부 판단)
```

---

## 🎯 팀 규칙

### 개발자 책임
1. **커밋 전**: 린트 검사, 빌드 테스트
2. **PR 전**: 코드 자가 검토, 테스트 확인
3. **리뷰**: 24시간 내 응답, 건설적 피드백

### 브랜치 관리
1. **정기 정리**: 병합된 브랜치는 즉시 삭제
2. **동기화**: dev 브랜치 정기적 pull
3. **네이밍**: 명확하고 일관된 브랜치명 사용

---

## 🚨 비상 절차

### 배포 후 긴급 상황
1. **롤백**: 이전 버전으로 즉시 배포
2. **Hotfix**: main 브랜치에서 긴급 수정
3. **커뮤니케이션**: 팀 내 즉시 공유

### 브랜치 충돌 해결
1. **로컬에서 해결**: merge 또는 rebase
2. **테스트**: 충돌 해결 후 기능 테스트
3. **재검토**: 충돌 해결 내용 리뷰

---

**마지막 업데이트**: 2025-06-24  
**작성자**: TeacherCan 개발팀  
**버전**: 1.0