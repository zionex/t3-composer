# T3Composer Backend — Spring Boot 3.0.13 (DevTools dev container)
# Phase 1: 컨테이너 안에서 mvn spring-boot:run 으로 띄워 DevTools 의 hot-reload 사용.
# - host 의 ./backend 가 /app 에 마운트되어 src 변경 → mvn compile → DevTools auto-restart.
# - host 의 ./backend/target 도 마운트되어 빌드 산출물이 host 에 남음 (.gitignore 됨).
# - Maven local repo 는 named volume composer-maven-repo:/root/.m2 로 캐시.

FROM eclipse-temurin:17-jdk

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         maven wget curl \
         fontconfig fonts-noto-core fonts-noto-cjk \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

# Node.js 18 + @anthropic-ai/claude-code CLI (LLM_BACKEND=cli 모드용)
# host 의 ~/.claude 가 /root/.claude 로 마운트되어 dev 본인 로그인 재사용.
# API 모드 (LLM_BACKEND=api 또는 미설정) 에서도 설치만 하고 사용 안 함 — 토글 즉시 전환 가능.
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && npm install -g @anthropic-ai/claude-code \
 && claude --version \
 && rm -rf /var/lib/apt/lists/*

# 캐시 워밍 — 실제 빌드 시점에는 host 마운트가 덮어쓰지만, 첫 이미지 빌드 시 dependency 다운로드를
# layer 에 박아두어 host pom.xml 이 같으면 named volume 도 빠르게 채워짐.
COPY backend/pom.xml ./pom.xml
RUN mvn -B -q dependency:go-offline -DskipTests || true

EXPOSE 8090

ENV JAVA_OPTS="-Xms256m -Xmx1024m -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Seoul"

# spring-boot:run 으로 띄워 DevTools 가 target/classes 변경 시 자동 restart.
# host 마운트로 src 가 바뀌면 외부 (또는 ArtifactApplyService) 가 mvn compile 트리거 → 자동 재기동.
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
