# 🚙 FleetControl

Sistema de gestión de flota vehicular. Control de check-in/check-out, kilometraje, mantenimiento y responsabilidades.

---

## 🚀 Ejecución con un solo comando

```bash
docker-compose up --build
```

Luego abre: **http://localhost:3000**

---

## 👤 Usuarios de prueba

| Usuario | Contraseña   | Rol   |
|---------|-------------|-------|
| host    | Admin1234!  | HOST  |
| admin   | Admin1234!  | ADMIN |
| pilot1  | Admin1234!  | PILOT |

---

## 🏗️ Arquitectura

```
fleetcontrol/
├── docker-compose.yml         # Orquesta los 3 servicios
├── database/
│   └── init.sql               # Schema + datos iniciales
├── backend/                   # Node.js + Express (puerto 4000)
│   ├── Dockerfile
│   └── src/
│       ├── index.js           # Entry point
│       ├── db.js              # Conexión PostgreSQL
│       ├── middleware/auth.js # JWT + roles
│       ├── controllers/       # Lógica de negocio
│       ├── routes/index.js    # Todas las rutas API
│       └── utils/logger.js    # Logs a BD
└── frontend/                  # React (puerto 3000)
    └── src/
        ├── App.jsx            # Router principal
        ├── contexts/          # AuthContext
        ├── services/api.js    # Axios configurado
        ├── components/        # Navbar, AlertBell
        └── pages/             # Una página por vista
```

---

## 📡 API Endpoints

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| POST | /api/auth/login | Login | Público |
| GET | /api/vehicles | Lista vehículos | Todos |
| POST | /api/vehicles | Crear vehículo | HOST |
| PUT | /api/vehicles/:id | Editar vehículo | HOST |
| GET | /api/users | Lista usuarios | HOST, ADMIN |
| POST | /api/users | Crear usuario | HOST, ADMIN |
| POST | /api/usage/checkin | Check-in | PILOT |
| POST | /api/usage/checkout | Check-out | PILOT, ADMIN, HOST |
| GET | /api/usage/history | Historial | Todos (filtrado) |
| GET | /api/alerts | Alertas | Todos |
| GET | /api/reports/export | Exportar CSV | HOST, ADMIN |
| GET | /api/reports/logs | Logs sistema | HOST |

---

## 🛠️ Tecnologías

- **Frontend**: React 18, React Router 6, Axios
- **Backend**: Node.js 20, Express 4, bcrypt, JWT
- **Base de datos**: PostgreSQL 15
- **Contenedores**: Docker + Docker Compose
