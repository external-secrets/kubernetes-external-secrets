FROM node:12.13.0-alpine

RUN npm install npm@6.4.1 -g

# Setup source directory
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install

# Copy app to source directory
COPY . /app

CMD ["/app/node_modules/.bin/mocha", "--timeout", "10000", "/app/e2e/tests/*.test.js"]
