FROM node:19-alpine3.17
RUN apk add tzdata
ENV TZ=Asia/Tokyo

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --prod --frozen-lockfile

COPY . .
EXPOSE 3000
CMD ["yarn", "ts-node", "src/index.ts"]