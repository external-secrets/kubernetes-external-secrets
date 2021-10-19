FROM node:14-alpine3.14

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL warn

# Setup source directory
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Copy app to source directory
COPY . .

# Change back to the "node" user; using its UID for PodSecurityPolicy "non-root" compatibility
USER 1000
CMD ["npm", "start"]
