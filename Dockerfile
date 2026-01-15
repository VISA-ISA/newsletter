FROM node:24-alpine
WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force



COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]