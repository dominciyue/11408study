FROM openjdk:17-jdk-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY .mvn/settings.xml /root/.m2/settings.xml
COPY pom.xml .
RUN mvn -s /root/.m2/settings.xml dependency:go-offline -B
COPY src ./src
RUN mvn -s /root/.m2/settings.xml package -DskipTests -B

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
