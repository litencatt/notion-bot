FROM node:19-alpine3.17
RUN apk add tzdata
ENV TZ=Asia/Tokyo
COPY . /app
WORKDIR /app
RUN yarn
EXPOSE 3000
CMD ["yarn", "ts-node", "src/index.ts"]