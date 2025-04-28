# --- 1. 빌드 스테이지 ---
    FROM node:20 as builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci --only=production
    
    COPY . .
    RUN npm run build
    
    # --- 2. 런타임 스테이지 ---
    FROM node:20
    
    # Nginx 설치
    RUN apt-get update && apt-get install -y nginx
    
    # 작업 디렉토리 설정
    WORKDIR /app
    
    # 빌드 산출물만 복사
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/package*.json ./
    
    # 필요한 추가 파일 복사
    COPY /nginx/default-ssl.conf /etc/nginx/default-ssl.conf
    COPY /nginx/default-http.conf /etc/nginx/default-http.conf
    COPY nginx/start.sh /start.sh
    RUN chmod +x /start.sh
    
    # PM2 설치 (런타임만)
    RUN npm install -g pm2
    
    # 포트 노출
    EXPOSE 80 443 3000
    
    # 시작 명령어
    CMD ["/start.sh"]
    