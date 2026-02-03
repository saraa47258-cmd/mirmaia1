# Mirmaia VPS Deploy with Nginx Proxy Manager

This project is now prepared for VPS deployment behind **Nginx Proxy Manager (NPM)**.

## 1) Prepare environment

```bash
cp .env.example .env
```

Edit `.env` and set secure values:
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`
- `REACT_APP_API_URL` (example: `https://api.your-domain.com/api`)

## 2) Start containers

```bash
docker compose up -d --build
```

Containers:
- `mirmaia-db` (MySQL, separate container)
- `mirmaia-backend`
- `mirmaia-frontend`
- `mirmaia-phpmyadmin` (optional, with profile `tools`)

Optional phpMyAdmin:
```bash
docker compose --profile tools up -d
```

## 3) Configure Nginx Proxy Manager

Create two Proxy Hosts:

1) Frontend host (example: `pos.your-domain.com`)
- Forward Hostname/IP: `127.0.0.1`
- Forward Port: `3001`
- Websockets: enabled
- SSL: request Let's Encrypt certificate

2) API host (example: `api.your-domain.com`)
- Forward Hostname/IP: `127.0.0.1`
- Forward Port: `3000`
- Websockets: enabled
- SSL: request Let's Encrypt certificate

## 4) Notes

- MySQL is isolated in its own container and linked to backend using Docker network + `DB_HOST=mysql`.
- Backend and frontend ports are bound to localhost only (`127.0.0.1`) for safer VPS exposure.
- Uploaded product images are persisted in Docker volume `backend_uploads`.
