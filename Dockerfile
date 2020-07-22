FROM node:14-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# optimization to have the install as a separate stage
RUN npm ci

# Bundle app source
COPY . .

RUN npm run build:prod

FROM node:14-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist/main.js .
EXPOSE 3000

CMD [ "node", "main.js" ]