FROM node:24-alpine
WORKDIR /app


COPY yarn.lock ./
COPY package.json ./

RUN yarn install --frozen-lockfile --production && yarn cache clean

RUN yarn global add pm2

COPY . .

EXPOSE 4000

ENV NODE_ENV=production

CMD ["pm2-runtime", "start", "server.js"]