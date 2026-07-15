#!/bin/sh
set -e

# Generar env.js a partir de variables de entorno antes de iniciar Nginx
envsubst < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/env.js

# Iniciar Nginx en primer plano
exec nginx -g 'daemon off;'
