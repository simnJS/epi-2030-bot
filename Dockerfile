FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=build /app/dist ./dist
COPY --from=build /app/config.yaml ./dist/config.yaml
COPY --from=build /app/prisma ./prisma

USER node
CMD ["node", "dist/index.js"]
