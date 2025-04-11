#!/bin/bash

# SSL 인증서 확인
if [ -f "/etc/nginx/ssl/fullchain.pem" ] && [ -f "/etc/nginx/ssl/privkey.pem" ]; then
  echo "SSL certificates found, configuring HTTPS"
  cp /etc/nginx/default-ssl.conf /etc/nginx/conf.d/default.conf

  cp /etc/nginx/ssl/fullchain.pem /certs/fullchain.pem
  cp /etc/nginx/ssl/privkey.pem /certs/privkey.pem
  chmod 644 /certs/fullchain.pem
  chmod 600 /certs/privkey.pem
else
  echo "SSL certificates not found, using HTTP only"
  cp /etc/nginx/default-http.conf /etc/nginx/conf.d/default.conf
fi

# Nginx 시작
nginx

# NestJS 클러스터링 실행
cd /app
pm2-runtime dist/main.js -i max
