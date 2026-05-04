# Multi-stage build for the Spring Boot backend.
# Stage 1: Maven cache + dependency resolution to keep rebuilds fast.
# Stage 2: copy source + build the boot jar.
# Stage 3: minimal JRE runtime image.

# ---------- Stage 1: dependency cache ----------
FROM maven:3.9-eclipse-temurin-25-alpine AS deps
WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline -DskipTests

# ---------- Stage 2: build ----------
FROM maven:3.9-eclipse-temurin-25-alpine AS build
WORKDIR /workspace
COPY --from=deps /root/.m2 /root/.m2
COPY pom.xml ./
COPY lombok.config ./
COPY src ./src
RUN mvn -B -ntp clean package -DskipTests && \
    cp target/ajs-*.jar /workspace/app.jar

# ---------- Stage 3: runtime ----------
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Non-root user for runtime
RUN addgroup -S ajs && adduser -S ajs -G ajs

COPY --from=build --chown=ajs:ajs /workspace/app.jar /app/app.jar

USER ajs

EXPOSE 8080

# JVM tuning: container-aware heap sizing, sane defaults for a 512MB-2GB pod
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

# Spring Boot's actuator health endpoint is the readiness signal
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health/readiness | grep -q '"status":"UP"' || exit 1

ENTRYPOINT exec java $JAVA_OPTS -jar /app/app.jar
