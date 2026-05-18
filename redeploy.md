# 🚀 Proteinbar — Redeployment Guide

## Server Info

| Item         | Value               |
| ------------ | ------------------- |
| VPS IP       | `72.61.97.128`      |
| SSH User     | `root`              |
| Admin App    | `/var/www/admin`    |
| Customer App | `/var/www/customer` |
| Backend App  | `/var/www/backend`  |

---

## Step 1 — Connect to VPS

Open your terminal (CMD, PowerShell, or Terminal) and run:

```bash
ssh root@72.61.97.128
```

---

## Step 2 — Pull Latest Code

If your project is on Git, pull the latest changes for each app:

```bash
# Admin Dashboard
cd /var/www/admin
git pull origin main

# Customer Website
cd /var/www/customer
git pull origin main

# Backend
cd /var/www/backend
git pull origin main
```

> **Note:** Replace `main` with your branch name if different (e.g. `master`)

---

## Step 3 — Install New Dependencies (if package.json changed)

```bash
# Admin
cd /var/www/admin && npm install

# Customer
cd /var/www/customer && npm install

# Backend
cd /var/www/backend && npm install
```

---

## Step 4 — Rebuild & Restart Apps

### Option A — Update ALL 3 apps at once:

```bash
cd /var/www/backend && npm run build && pm2 restart backend
cd /var/www/admin && npm run build && pm2 restart admin
cd /var/www/customer && npm run build && pm2 restart customer
```

### Option B — Update only Backend:

```bash
cd /var/www/backend
npm install
npm run build
pm2 restart backend
```

### Option C — Update only Admin Dashboard:

```bash
cd /var/www/admin
npm install
npm run build
pm2 restart admin
```

### Option D — Update only Customer Website:

```bash
cd /var/www/customer
npm install
npm run build
pm2 restart customer
```

---

## Step 5 — Verify Everything is Running

```bash
pm2 list
```

All 3 apps should show `online` status:

```
┌────┬──────────┬────────┬───────────┐
│ id │ name     │ uptime │ status    │
├────┼──────────┼────────┼───────────┤
│ 0  │ admin    │ 1m     │ online    │
│ 1  │ customer │ 1m     │ online    │
│ 2  │ backend  │ 1m     │ online    │
└────┴──────────┴────────┴───────────┘
```

---

## Step 6 — Check Logs (if something is wrong)

```bash
# View logs for all apps
pm2 logs

# View logs for specific app
pm2 logs admin
pm2 logs customer
pm2 logs backend

# Clear logs
pm2 flush
```

---

## Your Live URLs

| App                 | URL                                 |
| ------------------- | ----------------------------------- |
| 🌐 Customer Website | `https://proteinbargroup.com`       |
| ⚙️ Admin Dashboard  | `https://admin.proteinbargroup.com` |
| 🔧 Backend API      | `https://api.proteinbargroup.com`   |

---

## Useful PM2 Commands

| Command                | Description           |
| ---------------------- | --------------------- |
| `pm2 list`             | Show all running apps |
| `pm2 restart all`      | Restart all apps      |
| `pm2 restart backend`  | Restart only backend  |
| `pm2 restart admin`    | Restart only admin    |
| `pm2 restart customer` | Restart only customer |
| `pm2 stop all`         | Stop all apps         |
| `pm2 logs`             | View live logs        |
| `pm2 monit`            | Monitor CPU & memory  |

---

## Useful Nginx Commands

| Command                   | Description        |
| ------------------------- | ------------------ |
| `nginx -t`                | Test Nginx config  |
| `systemctl reload nginx`  | Reload Nginx       |
| `systemctl restart nginx` | Restart Nginx      |
| `systemctl status nginx`  | Check Nginx status |

---

## Environment Variables

If you need to update `.env` files:

```bash
# Backend
nano /var/www/backend/.env

# Admin
nano /var/www/admin/.env

# Customer
nano /var/www/customer/.env
```

After updating `.env`, always rebuild and restart:

```bash
cd /var/www/backend && npm run build && pm2 restart backend
cd /var/www/admin && npm run build && pm2 restart admin
cd /var/www/customer && npm run build && pm2 restart customer
```

---

## Current .env Values

### Backend (`/var/www/backend/.env`)

```env
FRONTEND_ORIGINS=https://proteinbargroup.com,https://www.proteinbargroup.com,https://admin.proteinbargroup.com
```

### Admin & Customer (`/var/www/admin/.env` and `/var/www/customer/.env`)

```env
NEXT_PUBLIC_API_BASE_URL=https://api.proteinbargroup.com/api/v1
```

---

## SSL Certificate

SSL auto-renews every 90 days via Certbot. To manually renew:

```bash
certbot renew
systemctl reload nginx
```

---

## Quick Redeploy (Copy & Paste)

For a full redeploy of all apps in one go:

```bash
cd /var/www/backend && git pull origin main && npm install && npm run build && pm2 restart backend && \
cd /var/www/admin && git pull origin main && npm install && npm run build && pm2 restart admin && \
cd /var/www/customer && git pull origin main && npm install && npm run build && pm2 restart customer && \
pm2 list
```

---

_Last updated: May 2026_
