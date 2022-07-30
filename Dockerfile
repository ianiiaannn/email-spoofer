FROM node:lts
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build
ENTRYPOINT node .