FROM node:12.19.0-alpine

ARG HTTP_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTP_PROXY}

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL info

# Setup source directory
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Copy app to source directory
COPY . .

# Change back to the "node" user; using its UID for PodSecurityPolicy "non-root" compatibility
USER 1000
CMD ["npm", "start"]
