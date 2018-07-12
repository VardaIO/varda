FROM node:9.11.2-alpine

RUN mkdir -p /home/root/app
RUN apk update --repository https://mirrors.aliyun.com/alpine/v3.6/main/ && apk add tzdata --repository https://mirrors.aliyun.com/alpine/v3.6/main/ --allow-untrusted && apk add git --repository https://mirrors.aliyun.com/alpine/v3.6/main/ --allow-untrusted && apk add bash --repository https://mirrors.aliyun.com/alpine/v3.6/main/ --allow-untrusted

COPY package.json /home/root/app

RUN rm -rf initialComplete

COPY . /home/root/app

WORKDIR /home/root/app

RUN  npm install --registry=https://registry.npm.taobao.org 
RUN  node init

EXPOSE 3000
EXPOSE 4002

CMD ["npm", "start"]  