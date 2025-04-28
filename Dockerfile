# --- 1. 빌드 스테이지 ---
    FROM node:20 as builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci --only=production
    
    # 🔥 여기 추가
    RUN npm install -g @nestjs/cli
    
    COPY . .
    RUN npm run build
    
    # --- 2. 런타임 스테이지 ---
    FROM node:20
    
    # Nginx 설치
    RUN apt-get update && apt-get install -y nginx
    
    WORKDIR /app
    
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/package*.json ./
    COPY /nginx/default-ssl.conf /etc/nginx/default-ssl.conf
    COPY /nginx/default-http.conf /etc/nginx/default-http.conf
    COPY nginx/start.sh /start.sh
    RUN chmod +x /start.sh
    
    RUN npm install -g pm2
    
    EXPOSE 80 443 3000
    
    CMD ["/start.sh"]
    