FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000

# TODO use precompiled js instead of ts-node here?
CMD [ "node", "start" ]