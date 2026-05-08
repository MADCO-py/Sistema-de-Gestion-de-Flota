# 🚀 Cómo subir FleetControl a Railway

## Paso 1 — Crea cuenta en Railway
Ve a https://railway.app y regístrate con GitHub (recomendado).

## Paso 2 — Sube el código a GitHub
```bash
git init
git add .
git commit -m "FleetControl initial deploy"
# Crea un repo en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/fleetcontrol.git
git push -u origin main
```

## Paso 3 — Crear proyecto en Railway

### Base de datos PostgreSQL:
1. En Railway → "New Project" → "Database" → "PostgreSQL"
2. Click en la BD → "Variables" → copia el `DATABASE_URL`

### Backend:
1. "New Service" → "GitHub Repo" → selecciona tu repo
2. Root directory: `backend`
3. En Variables agrega:
```
PORT=4000
DB_HOST=       ← de la BD de Railway (internal host)
DB_PORT=5432
DB_USER=       ← de la BD de Railway
DB_PASSWORD=   ← de la BD de Railway
DB_NAME=       ← de la BD de Railway
JWT_SECRET=    ← pon cualquier string largo y aleatorio
JWT_EXPIRES_IN=8h
UPLOAD_DIR=/app/uploads
NODE_ENV=production
```

### Frontend:
1. "New Service" → "GitHub Repo" → mismo repo
2. Root directory: `frontend`
3. En Variables agrega:
```
REACT_APP_API_URL=https://TU-BACKEND.railway.app/api
```

## Paso 4 — Correr el init.sql en la BD
En Railway → tu servicio PostgreSQL → "Query" → pega el contenido de `database/init.sql`

## Paso 5 — Dominio personalizado (opcional)
En cada servicio → "Settings" → "Domains" → "Generate Domain" o conecta el tuyo.

## Credenciales iniciales
- host: Admin1234!
- admin: Admin1234!  ← CAMBIA ESTO INMEDIATAMENTE
- pilot1: Admin1234!

## Notas importantes
- Las fotos se guardan en el volumen del backend
- Railway mantiene los volúmenes entre deploys
- Si borras el servicio, las fotos se pierden
- Para backup de fotos: Railway → tu servicio → "Volumes"
