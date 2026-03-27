# Dockerfile para EnviAPP Backend (Cloud Run)
FROM node:20-slim

WORKDIR /app

# Copiar archivos de dependencia
COPY package*.json ./

# Instalar dependencias (incluyendo tsx para ejecutar .ts directamente o tsc para compilar)
# Nota: Para Cloud Run es mejor compilar a JS, pero para simplicidad usaremos tsx
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto (Cloud Run usa el definido en la variable de entorno PORT)
EXPOSE 3001

# Comando para iniciar el servidor
CMD ["npx", "tsx", "server.ts"]
