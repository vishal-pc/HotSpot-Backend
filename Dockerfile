FROM node:20-alpine As development

WORKDIR /user/application

COPY package.json ./
COPY package-lock.json ./
COPY apple_public.pem ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine As production

WORKDIR /user/application

COPY package.json ./
COPY package-lock.json ./
COPY apple_public.pem ./

RUN npm install --omit:dev

COPY --from=development /user/application/dist ./dist

CMD ["node","./dist/src/app"]