FROM node:14-alpine3.14

# Setup source directory
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci

# Copy app to source directory
COPY . /app

CMD ["/app/node_modules/.bin/mocha", "--timeout", "10000", "/app/e2e/tests/*.test.js"]
