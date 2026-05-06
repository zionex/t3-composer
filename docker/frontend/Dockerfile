# T3Composer Frontend — webpack-dev-server
# 프로덕션 배포 시엔 별도 nginx Dockerfile 필요.

FROM node:18-bullseye

WORKDIR /app

COPY frontend/package.json ./package.json
COPY frontend/package-lock.json* ./

RUN npm install --no-audit --no-fund --legacy-peer-deps || npm install --no-audit --no-fund

COPY frontend/ ./

EXPOSE 5173

# webpack-dev-server 는 0.0.0.0 바인딩 필수 (Docker 내부 접속용)
CMD ["npm", "run", "dev"]
