FROM node:20-alpine
WORKDIR /app
COPY package.json ./
# Sin cache de npm para forzar instalación limpia
RUN npm install --production --no-cache
COPY . .
EXPOSE 4000
CMD ["node", "src/index.js"]
