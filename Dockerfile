FROM node:18-alpine

WORKDIR /opt/bot

COPY package*.json ./
RUN npm install

COPY . .

CMD [ "npm", "start" ]
