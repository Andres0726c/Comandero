FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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
