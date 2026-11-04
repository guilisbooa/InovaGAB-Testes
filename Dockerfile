FROM node:20-bookworm-slim
WORKDIR /workspace
RUN npm install --global firebase-tools@13.29.2
COPY firebase.json firestore.test.rules ./
EXPOSE 8080 9099
CMD ["firebase", "emulators:start", "--project", "demo-inovagab", "--only", "auth,firestore"]