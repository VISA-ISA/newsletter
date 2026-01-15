FROM node:24-alpine
WORKDIR /app

COPY yarn.lock ./
COPY package.json ./

RUN yarn install --frozen-lockfile --production && yarn cache clean


RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

COPY . .

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production

CMD ["npm", "start"]