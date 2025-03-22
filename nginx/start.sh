#!/bin/bash

# SSL 인증서 확인
if [ -f "/etc/nginx/ssl/fullchain.pem" ] && [ -f "/etc/nginx/ssl/privkey.pem" ]; then
  echo "SSL certificates found, configuring HTTPS"
  # SSL 설정으로 Nginx 구성
  cp /etc/nginx/default-ssl.conf /etc/nginx/conf.d/default.conf
  
  # 인증서 복사 (마운트된 볼륨에서 컨테이너 내부 경로로)
  cp /etc/nginx/ssl/fullchain.pem /certs/fullchain.pem
  cp /etc/nginx/ssl/privkey.pem /certs/privkey.pem
  chmod 644 /certs/fullchain.pem
  chmod 600 /certs/privkey.pem
else
  echo "SSL certificates not found, using HTTP only"
  # HTTP만 사용하는 설정
  cp /etc/nginx/default-http.conf /etc/nginx/conf.d/default.conf
fi

# Nginx 시작
nginx

# NestJS 애플리케이션 시작
cd /app
npm start