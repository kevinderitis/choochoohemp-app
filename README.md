# Choo Choo Hemp

PWA full-stack para catalogo, pedidos y panel admin de Choo Choo Hemp.

## Stack

- Monorepo con workspaces
- `apps/web`: React + Vite + TypeScript + Tailwind + Framer Motion + PWA
- `apps/api`: Node.js + Express + TypeScript + MongoDB + Mongoose + JWT
- `packages/shared`: tipos compartidos

## Features

- Age gate +18 obligatorio
- Disclaimer legal visible
- Catalogo con branding oscuro premium
- Detalle de producto
- Carrito y checkout cash
- Registro/login cliente con JWT
- Historial de pedidos y polling de estado
- Push notifications con Web Push / VAPID
- Panel admin con metricas, pedidos y sync de productos
- Importador real desde:
  - `https://wishlist.choochoohemp.com/strains`
  - `https://wishlist.choochoohemp.com/edibles`
  - `https://wishlist.choochoohemp.com/nicotine`

## Setup

1. Instalar dependencias:

```bash
npm install
```

2. Crear variables de entorno:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Levantar MongoDB local o configurar `MONGODB_URI`.

4. Seed del admin:

```bash
npm run seed:admin
```

5. Importar catalogo:

```bash
npm run import:products
```

6. Desarrollo:

```bash
npm run dev
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run import:products`
- `npm run seed:admin`

## Endpoints principales

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Products

- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/products/import`

### Orders

- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`

### Notifications

- `GET /api/notifications/config`
- `POST /api/notifications/subscribe`
- `POST /api/notifications/unsubscribe`
- `POST /api/admin/notifications/send`

### Settings

- `GET /api/settings`
- `PUT /api/admin/settings`

## Notes

- Si no hay productos importados, la API entrega mock products.
- El importador usa las APIs reales del wishlist y guarda `sourceUrl`, evita duplicados por `slug` o `name`.
- `card` esta visible en UX pero bloqueado con mensaje `Coming soon`.
- Para push notifications en produccion, generar claves VAPID y cargarlas en `apps/api/.env`.
