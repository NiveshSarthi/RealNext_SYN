# Deployment Guide: Coolify

Since you have a **monorepo** (root folder with `frontend` and `backend` subfolders), the best way to deploy on Coolify is using **Docker Compose**.

## 🚀 Recommended Method: Docker Compose

1. **Go to your Coolify Dashboard**.
2. Select your Project -> Environment -> **+ New Resource**.
3. Select **Docker Compose**.
4. You can direct it to your Git Repository (GitHub/GitLab) and it will automatically detect the `docker-compose.yml` file in the root.

---

## 📋 Configuration Steps

### 1. Environment Variables (Critical)
Because we are deploying to production, you cannot rely on the `.env` file being in your repository (it's ignored for security). You must manually add these variables in the **Coolify Environment Variables** section for your resource.

#### Backend Variables
Add these to the Coolify Service configuration:
```env
NODE_ENV=production
PORT=5000
# Database (External: 72.61.248.175)
DB_HOST=72.61.248.175
DB_PORT=5443
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR_DB_PASSWORD]
# Security
JWT_SECRET=[GENERATE_A_LONG_SEARCH_KEY]
JWT_REFRESH_SECRET=[GENERATE_ANOTHER_LONG_KEY]
# URLs
FRONTEND_URL=https://[YOUR_FRONTEND_DOMAIN]
WHATSAPP_API_URL=https://ckk4swcsssos844w0ccos4og.72.61.248.175.sslip.io
```

#### Frontend Variables
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://[YOUR_BACKEND_DOMAIN]
```

### 2. Domains
In Coolify settings for the service:
- **Frontend Service**: Map port `3000` to your main domain (e.g., `app.yourdomain.com`).
- **Backend Service**: Map port `5000` to your api domain (e.g., `api.yourdomain.com`).

### 3. Build Settings
Coolify usually detects the configuration automatically from the `docker-compose.yml`.
- It will build the backend from `./backend/Dockerfile`
- It will build the frontend from `./frontend/Dockerfile`

---

## ✅ Database Check
You confirmed you want to user the **External Database**. 
- **Status**: Ready.
- **Config**: The `DB_HOST` variable is set to your external IP (`72.61.248.175`). 
- **Persistence**: Since the database is external, your data is safe and persists independently of these Docker containers.

## 🛠 Troubleshooting
- **Frontend cannot reach Backend**: Ensure `NEXT_PUBLIC_API_URL` in the **Frontend** environment variables points to the *public HTTPS domain* of your backend (e.g., `https://api.yourdomain.com`), NOT `localhost` or `http://backend:5000`. This is because the frontend code runs in the user's browser.
