FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# REACT_APP_* se embebe en build time, no en runtime
ARG REACT_APP_API_URL=http://localhost:4000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
EXPOSE 3000
CMD ["npm", "start"]
