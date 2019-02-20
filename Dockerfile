FROM node:10.15.1-alpine

# Set ENV vars
ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL info

# Setup source directory
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/

# npm install
ARG skip_install=
RUN npm install npm@6.4.1 -g
RUN if [ -z "$skip_install" ]; then npm ci; fi

# Copy app to source directory
COPY . /app

USER node
CMD ["npm", "start"]
