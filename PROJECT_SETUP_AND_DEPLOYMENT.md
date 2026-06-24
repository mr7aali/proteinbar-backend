# Proteinbar Project Setup and Deployment Guide

This document covers the three applications that make up the Proteinbar
platform:

| Application | Local directory | Technology | Local port | PM2 name |
| --- | --- | --- | --- | --- |
| Customer website | `C:\Aali\proteinbar\proteinbar` | Next.js | `3000` | `customer` |
| Admin dashboard | `C:\Aali\proteinbar\proteinbar_admin_dashboard` | Next.js | `3001` | `admin` |
| Backend API | `C:\Aali\proteinbar\proteinbar-backend` | Express and TypeScript | `5000` | `backend` |

## 1. Prerequisites

Install the following before setting up the project:

- Node.js 20 LTS or newer
- npm
- Git
- Access to the project's MongoDB database
- Required Cloudinary, SMTP, and CMI credentials

Confirm that Node.js and npm are available:

```powershell
node --version
npm --version
git --version
```

## 2. Install Dependencies

The repositories contain `package-lock.json` files, so npm is the recommended
package manager.

### Customer website

```powershell
cd C:\Aali\proteinbar\proteinbar
npm ci
```

### Admin dashboard

```powershell
cd C:\Aali\proteinbar\proteinbar_admin_dashboard
npm ci
```

### Backend API

```powershell
cd C:\Aali\proteinbar\proteinbar-backend
npm ci
```

Use `npm install` instead of `npm ci` only when intentionally adding or
updating packages.

## 3. Configure Environment Variables

Each application reads its configuration from a `.env` file. Never commit
real passwords, API secrets, database credentials, or payment keys to Git.

### Customer website

Create `C:\Aali\proteinbar\proteinbar\.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Production value:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.proteinbargroup.com/api/v1
```

### Admin dashboard

Create `C:\Aali\proteinbar\proteinbar_admin_dashboard\.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Production value:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.proteinbargroup.com/api/v1
```

Variables beginning with `NEXT_PUBLIC_` are included in the browser bundle.
They must never contain secrets.

### Backend API

Create `C:\Aali\proteinbar\proteinbar-backend\.env`. Replace every placeholder
with the correct value for the target environment:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=<mongodb-connection-string>
JWT_SECRET=<long-random-secret-at-least-8-characters>
JWT_EXPIRES_IN=7d

FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_PUBLIC_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:5000
CMI_PUBLIC_BASE_URL=http://localhost:5000

CUSTOMER_SESSION_COOKIE_NAME=proteinbar_customer_session
CUSTOMER_SESSION_DAYS=7

CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
CLOUDINARY_FOLDER=proteinbar

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password-or-app-password>
SMTP_FROM_EMAIL=<sender-email>
SMTP_FROM_NAME=Proteinbar

CMI_GATEWAY_URL=https://test-lanacash.cmi.co.ma/fim/est3dgate
CMI_CLIENT_ID=<cmi-client-id>
CMI_STORE_KEY=<cmi-store-key>
CMI_CURRENCY=504
CMI_LANG=fr
CMI_STORE_TYPE=3D_PAY_HOSTING
CMI_TRAN_TYPE=PreAuth
CMI_REFRESH_TIME=5
```

For production, use:

```env
NODE_ENV=production
FRONTEND_ORIGINS=https://proteinbargroup.com,https://www.proteinbargroup.com,https://admin.proteinbargroup.com
FRONTEND_PUBLIC_URL=https://proteinbargroup.com
BACKEND_BASE_URL=https://api.proteinbargroup.com
CMI_PUBLIC_BASE_URL=https://api.proteinbargroup.com
```

Keep the remaining production credentials only in the VPS `.env` file.

## 4. Run the Project Locally

Open three terminals and run one application in each terminal.

### Terminal 1: Backend API

```powershell
cd C:\Aali\proteinbar\proteinbar-backend
npm run dev
```

The API will be available at:

- API root: `http://localhost:5000/api/v1`
- Health check: `http://localhost:5000/health`

### Terminal 2: Customer website

```powershell
cd C:\Aali\proteinbar\proteinbar
npm run dev
```

Open `http://localhost:3000`.

### Terminal 3: Admin dashboard

Port `3000` is already used by the customer website, so run the admin
dashboard on port `3001`:

```powershell
cd C:\Aali\proteinbar\proteinbar_admin_dashboard
npm run dev -- -p 3001
```

Open `http://localhost:3001`.

## 5. Validate and Build the Project

Run the checks before deployment.

### Customer website

```powershell
cd C:\Aali\proteinbar\proteinbar
npm run lint
npm run build
```

### Admin dashboard

```powershell
cd C:\Aali\proteinbar\proteinbar_admin_dashboard
npm run lint
npm run build
```

### Backend API

```powershell
cd C:\Aali\proteinbar\proteinbar-backend
npm run typecheck
npm run build
```

The backend TypeScript build is written to the `dist` directory. The Next.js
production builds are written to each application's `.next` directory.

To test the production builds locally:

```powershell
# Customer website
cd C:\Aali\proteinbar\proteinbar
npm run start

# Admin dashboard
cd C:\Aali\proteinbar\proteinbar_admin_dashboard
npm run start -- -p 3001

# Backend API
cd C:\Aali\proteinbar\proteinbar-backend
npm run start
```

## 6. VPS Application Layout

The production server uses the following directories:

| Application | VPS directory | PM2 process |
| --- | --- | --- |
| Customer website | `/var/www/customer` | `customer` |
| Admin dashboard | `/var/www/admin` | `admin` |
| Backend API | `/var/www/backend` | `backend` |

Live services:

| Service | URL |
| --- | --- |
| Customer website | `https://proteinbargroup.com` |
| Admin dashboard | `https://admin.proteinbargroup.com` |
| Backend API | `https://api.proteinbargroup.com` |
| Backend health check | `https://api.proteinbargroup.com/health` |

## 7. Deploy Updates to the VPS

Connect to the server:

```bash
ssh root@72.61.97.128
```

Before pulling, confirm the deployment branch in each directory:

```bash
cd /var/www/customer && git branch --show-current
cd /var/www/admin && git branch --show-current
cd /var/www/backend && git branch --show-current
```

Replace `<deployment-branch>` below with the branch shown on the VPS. Use
`main` only if `main` is the actual deployed branch.

### Deploy the customer website

```bash
cd /var/www/customer
git pull origin <deployment-branch>
npm ci
npm run build
pm2 restart customer
```

### Deploy the admin dashboard

```bash
cd /var/www/admin
git pull origin <deployment-branch>
npm ci
npm run build
pm2 restart admin
```

### Deploy the backend API

```bash
cd /var/www/backend
git pull origin <deployment-branch>
npm ci
npm run build
pm2 restart backend
```

If `package-lock.json` has not changed, dependency installation may be
skipped. Running `npm ci` on every deployment is safer and ensures that the
installed packages exactly match the lock file.

Do not replace or delete the production `.env` files while pulling or
deploying code.

## 8. Restart Applications After Changes

### Code changes

Code changes should normally be rebuilt before restarting:

```bash
cd /var/www/customer && npm run build && pm2 restart customer
cd /var/www/admin && npm run build && pm2 restart admin
cd /var/www/backend && npm run build && pm2 restart backend
```

### Environment variable changes

Next.js public environment variables are embedded during the build, so the
customer and admin applications must be rebuilt after their `.env` files
change:

```bash
cd /var/www/customer && npm run build && pm2 restart customer
cd /var/www/admin && npm run build && pm2 restart admin
```

Restart the backend with environment variables refreshed:

```bash
cd /var/www/backend
npm run build
pm2 restart backend --update-env
```

### Restart without rebuilding

Use these commands only when no source code or build-time environment value
has changed:

```bash
pm2 restart customer
pm2 restart admin
pm2 restart backend
```

## 9. Verify a Deployment

Check PM2:

```bash
pm2 list
```

All three processes should show `online`.

Check logs:

```bash
pm2 logs customer --lines 100
pm2 logs admin --lines 100
pm2 logs backend --lines 100
```

Press `Ctrl+C` to exit the live log view.

Test the services:

```bash
curl -I https://proteinbargroup.com
curl -I https://admin.proteinbargroup.com
curl https://api.proteinbargroup.com/health
```

The backend health endpoint should return a successful JSON response with the
message `OK`.

If Nginx configuration was changed:

```bash
nginx -t
systemctl reload nginx
systemctl status nginx
```

Always run `nginx -t` successfully before reloading Nginx.

## 10. First-Time PM2 Setup

The following commands are only needed if the PM2 processes do not already
exist:

```bash
cd /var/www/customer
pm2 start npm --name customer -- start

cd /var/www/admin
pm2 start npm --name admin -- start -- -p 3001

cd /var/www/backend
pm2 start npm --name backend -- start

pm2 save
pm2 startup
```

Run the additional command printed by `pm2 startup`, then run `pm2 save`
again. This configures the applications to return automatically after a VPS
reboot.

## 11. Troubleshooting

### A frontend cannot reach the API

- Confirm `NEXT_PUBLIC_API_BASE_URL` ends with `/api/v1`.
- Confirm the backend process is online with `pm2 list`.
- Test `https://api.proteinbargroup.com/health`.
- Rebuild the frontend after changing `NEXT_PUBLIC_API_BASE_URL`.

### The backend exits immediately

- Run `pm2 logs backend --lines 100`.
- Confirm `MONGODB_URI` and `JWT_SECRET` are present.
- Check that port `5000` is not already occupied.
- Run `npm run typecheck` and `npm run build`.

### A Next.js application exits immediately

- Check its PM2 logs.
- Confirm that `npm run build` completed successfully.
- Confirm that the customer and admin applications are not configured to use
  the same port.

### The site returns a 502 error

- Confirm the relevant PM2 process is online.
- Confirm the application is listening on its expected port.
- Test Nginx configuration with `nginx -t`.
- Review `/var/log/nginx/error.log`.

## 12. Security Notes

- Never add real secrets to `.env.example`, README files, screenshots, or
  deployment documentation.
- Keep `.env` files out of Git.
- Use a long, randomly generated `JWT_SECRET`.
- Rotate any credential immediately if it has been committed to Git or shared
  publicly.
- Use separate development and production credentials.
- Back up the database before a deployment that changes stored data or runs a
  migration.
