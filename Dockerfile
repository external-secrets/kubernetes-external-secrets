FROM node:12.16.2-alpine

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL info

# Setup source directory
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Copy app to source directory
COPY . .

USER node
CMD ["npm", "start"]
