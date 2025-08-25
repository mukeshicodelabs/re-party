FROM node:18.20.1
WORKDIR /var/www/html/reparty
ARG ENVFILE
USER root
COPY ./ ./
COPY $ENVFILE ./.env
COPY ./package.json /.
RUN yarn install && yarn build
CMD ["npm", "start"]

