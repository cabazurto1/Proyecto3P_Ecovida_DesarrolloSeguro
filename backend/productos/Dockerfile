FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./

# Instala las dependencias y recompila bcrypt
RUN npm install && npm rebuild bcrypt --build-from-source

# Instalar netcat (nc) para esperar PostgreSQL
RUN apt-get update && apt-get install -y netcat-openbsd

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
