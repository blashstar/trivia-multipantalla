# Imagen ligera de Nginx para servir el frontend estático de la trivia
FROM nginx:alpine

# Instalar gettext para disponer de envsubst
RUN apk add --no-cache gettext

# Copiar todos los archivos del proyecto al directorio que Nginx sirve por defecto
COPY . /usr/share/nginx/html

# Copiar y preparar el script de entrada
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Exponer el puerto HTTP estándar
EXPOSE 80

# El entrypoint genera env.js desde variables de entorno y luego inicia Nginx
ENTRYPOINT ["/entrypoint.sh"]
