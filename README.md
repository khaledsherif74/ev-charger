# EV Charger Frontend

Standalone React + JavaScript + Redux frontend for the EV Charger System.

## Application areas

### Customer workspace
- `/login` — normal user sign-in
- `/app` — customer dashboard
- `/app/sessions` — customer charging sessions
- `/app/wallet` — wallet balance, history, and Paymob checkout creation

The customer workspace uses only the existing backend APIs:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/chargers`
- `GET /api/sessions/active`
- `GET /api/sessions`
- `POST /api/sessions`
- `POST /api/sessions/:id/stop`
- `GET /api/wallet`
- `GET /api/wallet/history`
- `POST /api/wallet/topup`

Realtime customer session updates use the backend Socket.IO events `session:update`, `session:ended`, `charger:status`, and `session:watch`.

### Administrator workspace
- `/admin/login` — dedicated administrator sign-in
- `/admin` — network overview
- `/admin/chargers` — charger fleet
- `/admin/sessions` — all sessions
- `/admin/logs` — OCPP logs
- `/admin/commands` — whitelisted charger commands

The admin workspace uses only the backend's existing `/api/admin/*` endpoints. The backend remains the source of truth for administrator authorization through `ADMIN_EMAILS`; the frontend does not implement or replace that authorization.

## Development

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` only when the frontend must call a separate backend origin. For same-origin deployment, leave it empty.

## Important

No backend business logic, OCPP logic, authentication logic, wallet logic, billing logic, or database schema is changed by this frontend.
