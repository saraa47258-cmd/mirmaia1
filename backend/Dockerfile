FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock*.json ./

RUN npm ci --legacy-peer-deps 2>&1 || npm install --legacy-peer-deps 2>&1

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
