FROM node:19-alpine3.17
RUN apk add tzdata
ENV TZ=Asia/Tokyo

WORKDIR /app
COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --prod --frozen-lockfile

COPY --chown=node:node . .

USER node
EXPOSE 3000
CMD ["yarn", "ts-node", "src/index.ts"]