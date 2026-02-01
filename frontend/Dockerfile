FROM node:16-alpine AS builder

WORKDIR /app

COPY package.json ./

# Install ajv first to resolve dependency issues
RUN npm install ajv@8.12.0 --save-exact 2>&1
RUN npm install --legacy-peer-deps 2>&1

COPY . .

ARG REACT_APP_API_URL=http://localhost:3000
ENV CI=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
