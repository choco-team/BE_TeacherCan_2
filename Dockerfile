# 1. 빌드 스테이지
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. 실행 스테이지
FROM node:20-slim

WORKDIR /app

# 앱 실행에 필요한 dist와 정적 파일을 각각 복사
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/exam ./dist/exam  # ✅ 정적 파일 직접 복사

RUN npm install --only=production

ENV PORT 8080

CMD ["node", "dist/main.js"]
