FROM node:18

WORKDIR /app

# Copiar los archivos de dependencias
COPY package.json package-lock.json ./

# Instalar las dependencias
RUN npm install

# Instalar netcat (nc) para esperar la conexión de PostgreSQL
RUN apt-get update && apt-get install -y netcat-openbsd

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto del microservicio
EXPOSE 3005

# Script para esperar a PostgreSQL antes de iniciar el servicio
CMD /bin/bash -c "until nc -z $POSTGRES_HOST $POSTGRES_PORT; do echo 'Esperando a PostgreSQL...'; sleep 2; done; echo 'PostgreSQL listo'; node index.js"
