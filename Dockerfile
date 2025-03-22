# 1. Node.js 베이스 이미지 사용
FROM node:20
RUN npm install -g @nestjs/cli
# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 설치 (npm ci 사용)
COPY package*.json ./
RUN npm ci --only=production

# 4. 소스 코드 복사
COPY . .

# 5. 빌드 수행
RUN npm run build

# Nginx SSL 설정 디렉토리 생성
RUN mkdir -p /etc/nginx/ssl/live/api.teachercan.com

# SSL 설정이 포함된 Nginx 설정 파일 복사
COPY /nginx/default.conf /etc/nginx/conf.d/default.conf

# 6. 포트 설정
EXPOSE 3000

# 7. 실행 명령어
CMD ["npm", "start"]
