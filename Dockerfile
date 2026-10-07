FROM node:24-alpine
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./

RUN corepack enable && \
    yarn install --immutable --mode=skip-build && \
    yarn cache clean


RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

COPY . .

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production

CMD ["yarn", "start:production"]
