FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production --silent || npm install --production --silent
COPY . .

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "index.js"]
