FROM node:19-alpine
RUN apk add tzdata
ENV TZ=Asia/Tokyo
COPY . /app
WORKDIR /app
RUN yarn
EXPOSE 3000
CMD ["yarn", "ts-node", "src/index.ts"]