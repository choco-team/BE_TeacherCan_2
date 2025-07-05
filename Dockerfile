# 1. Node.js 베이스 이미지
FROM node:20

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. Nest CLI만 전역 설치
RUN npm install -g @nestjs/cli

# 4. 의존성 설치
COPY package*.json ./
RUN npm ci --omit=dev

# 5. 소스 복사 및 빌드
COPY . .
RUN npm run build

# 6. 실행 스크립트 권한 부여
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 7. Cloud Run용 포트
EXPOSE 8080

# 8. 시작 명령
CMD ["/start.sh"]
