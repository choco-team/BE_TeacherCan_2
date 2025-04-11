# 1. Node.js 베이스 이미지 사용
FROM node:20
RUN npm install -g pm2
RUN npm install -g @nestjs/cli
# Nginx 설치
RUN apt-get update && apt-get install -y nginx

# 2. 작업 디렉토리 설정
WORKDIR /app
# 3. 의존성 설치 (npm ci 사용)
COPY package*.json ./
RUN npm ci --only=production
# 4. 소스 코드 복사
COPY . .
# 5. 빌드 수행
RUN npm run build

# Nginx 설정 디렉토리 생성
RUN mkdir -p /etc/nginx/ssl /certs

# 환경별 Nginx 설정 파일 복사
COPY /nginx/default-ssl.conf /etc/nginx/default-ssl.conf
COPY /nginx/default-http.conf /etc/nginx/default-http.conf

# 시작 스크립트 복사
COPY /nginx/start.sh /start.sh
RUN chmod +x /start.sh

# 6. 포트 설정
EXPOSE 80 443 3000

# 7. 실행 명령어 (시작 스크립트 실행)
CMD ["/start.sh"]