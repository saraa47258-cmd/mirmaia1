FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --production=false --legacy-peer-deps 2>&1

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
