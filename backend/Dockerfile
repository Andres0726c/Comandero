FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --include=dev

RUN npx prisma generate

COPY . .

RUN npm run build

RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/src/main"]
