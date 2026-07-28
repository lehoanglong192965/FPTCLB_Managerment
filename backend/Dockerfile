# ---- Stage 1: build the executable JAR with Java 21 ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw -B -DskipTests dependency:go-offline

COPY src ./src
RUN ./mvnw -B -DskipTests clean package

# ---- Stage 2: local verification runtime ----
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN groupadd --system fcms \
    && useradd --system --gid fcms --home-dir /app --no-create-home fcms \
    && mkdir -p /app/reports \
    && chown -R fcms:fcms /app

COPY --from=build --chown=fcms:fcms /app/target/backend-1.0.0.jar /app/app.jar

# This image is only for the local two-phase database bootstrap test. Azure App
# Service runs the JAR directly on its managed Java SE 21 runtime.
USER fcms
EXPOSE 8080

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Dfile.encoding=UTF-8"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
