# 1. Node.js 베이스 이미지
FROM node:20

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 설치
COPY package*.json ./
RUN npm ci --omit=dev

# 4. 소스 복사 및 빌드
COPY . .
RUN npm run build

# 5. 실행 스크립트 권한 부여
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 6. 포트 설정 (Cloud Run 필수)
EXPOSE 8080

# 7. 실행 명령
CMD ["/start.sh"]