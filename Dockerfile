FROM godaddy/node:10.5.0-alpine-3.1.1

# Set ENV vars
ENV DISABLE_NODEMON true
ENV NODE_ENV development
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

CMD ["npm", "start"]
