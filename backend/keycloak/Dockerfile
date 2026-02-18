FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/galaxyproject/keycloak-galaxy-user-provider.git .
RUN mvn package -B -DskipTests

FROM quay.io/keycloak/keycloak:26.0
COPY --from=builder /build/target/galaxy-user-provider.jar /opt/keycloak/providers/galaxy-user-provider.jar
