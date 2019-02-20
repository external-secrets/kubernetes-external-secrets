FROM node:10.15.1-alpine

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL info

RUN npm install npm@6.4.1 -g

# Setup source directory
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci --production

# Copy app to source directory
COPY . /app

USER node
CMD ["npm", "start"]
