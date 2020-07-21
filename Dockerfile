FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# optimization to have the install as a separate stage
RUN npm ci

# Bundle app source
COPY . .

RUN npm build:prod

EXPOSE 3000

CMD [ "node", "dist/main.js" ]