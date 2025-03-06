FROM node:18

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de dependencias primero (mejora la cacheabilidad)
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Instalar dependencias adicionales del sistema necesarias (netcat para esperar a PostgreSQL)
RUN apt-get update && apt-get install -y netcat-openbsd

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto del microservicio
EXPOSE 3002

# Comando para iniciar el servicio
CMD ["node", "index.js"]
