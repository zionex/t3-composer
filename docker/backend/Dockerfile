# T3Composer Backend — Spring Boot 3.0.13 fat jar (multi-stage)

# ---------- Stage 1: Build ----------
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

COPY backend/pom.xml ./pom.xml
RUN mvn -B -q dependency:go-offline -DskipTests || true

COPY backend/src ./src
RUN mvn -B -q clean package -DskipTests -Dmaven.test.skip=true

# ---------- Stage 2: Runtime ----------
FROM eclipse-temurin:17-jre

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/*.jar /app/app.jar

EXPOSE 8090

ENV JAVA_OPTS="-Xms256m -Xmx1024m -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Seoul"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
