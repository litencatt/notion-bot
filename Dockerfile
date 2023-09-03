FROM node:20-alpine as desp-stage

WORKDIR /app

COPY ./package.json ./yarn.lock ./
RUN yarn install --production --no-progress

FROM node:20-alpine as build-stage

WORKDIR /work
COPY . /work/

RUN yarn install --no-progress
RUN yarn build

FROM gcr.io/distroless/nodejs20-debian11 as runtime-stage
ENV NODE_ENV production
ENV LANG C.UTF-8
ENV TZ Asia/Tokyo

WORKDIR /app

COPY --chown=nonroot:nonroot ./package.json ./yarn.lock ./
COPY --chown=nonroot:nonroot --from=desp-stage /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=build-stage /work/dist ./dist
COPY --chown=nonroot:nonroot . .

USER nonroot

CMD ["dist/index.js"]
