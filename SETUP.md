# VacciPal - Complete Setup Guide

This guide will help you set up both the frontend and backend services for VacciPal.

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **MongoDB Atlas account** (free tier is sufficient) - [Sign up](https://www.mongodb.com/cloud/atlas)

## 🚀 Quick Start

### Step 1: Clone and Install Frontend Dependencies

```bash
# Navigate to project root
cd vacci-pal

# Install frontend dependencies
npm install
```

### Step 2: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a new cluster**:
   - Click "Create" or "Build a Database"
   - Choose FREE tier (M0)
   - Select a cloud provider and region
   - Click "Create Cluster"

3. **Create a database user**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter a username and password (save these!)
   - Set user privileges to "Read and write to any database"
   - Click "Add User"

4. **Whitelist your IP address**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ **Warning**: Only use this for development. For production, whitelist specific IPs.

5. **Get your connection string**:
   - Go to "Clusters" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `vaccipal` (or your preferred database name)

   Example:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vaccipal?retryWrites=true&w=majority
   ```

### Step 3: Set Up Backend

```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your MongoDB connection string
# Use your favorite text editor or:
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Update `.env` file:**
```env
PORT=5000
NODE_ENV=development

# Paste your MongoDB Atlas connection string here
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vaccipal?retryWrites=true&w=majority

# Generate a strong random string for JWT_SECRET (at least 32 characters)
# You can use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRY=7d

# Frontend URL (default Vite dev server port)
FRONTEND_URL=http://localhost:5173
```

### Step 4: Seed the Database (Optional but Recommended)

```bash
# Make sure you're in the server directory
cd server

# Run the seed script
npm run seed
```

This will create:
- 2 parent users
- 2 doctor users
- 2 children with vaccination schedules

**Demo Credentials:**
- Parent: `parent@demo.com` / `password123`
- Doctor: `doctor@aiims.com` / `password123`

### Step 5: Start the Backend Server

```bash
# Make sure you're in the server directory
cd server

# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

The backend should start on `http://localhost:5000`

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running in development mode on port 5000
```

### Step 6: Set Up Frontend Environment

```bash
# Navigate back to project root
cd ..

# Copy environment file
cp .env.example .env
```

**Update `.env` file:**
```env
# API Configuration - Point to your backend
VITE_API_URL=http://localhost:5000/api
```

### Step 7: Start the Frontend

```bash
# Make sure you're in the project root
npm run dev
```

The frontend should start on `http://localhost:5173` (or another port if 5173 is busy)

## ✅ Verification

1. **Backend Health Check**: Open `http://localhost:5000/health` in your browser
   - Should return: `{"success":true,"message":"VacciPal API is running",...}`

2. **Frontend**: Open `http://localhost:5173` in your browser
   - Should see the VacciPal login page

3. **Test Login**: Use demo credentials
   - Email: `parent@demo.com`
   - Password: `password123`

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Verify your connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure your database user password doesn't contain special characters (or URL-encode them)
- Wait a few minutes after creating the cluster (it takes time to provision)

**Port Already in Use:**
- Change `PORT` in `server/.env` to a different port (e.g., 5001)
- Update `VITE_API_URL` in frontend `.env` to match

**JWT Secret Error:**
- Make sure `JWT_SECRET` is at least 32 characters long
- Don't use quotes around the value in `.env`

### Frontend Issues

**API Connection Error:**
- Verify backend is running on the correct port
- Check `VITE_API_URL` in `.env` matches your backend URL
- Ensure CORS is configured correctly in backend (check `FRONTEND_URL` in `server/.env`)

**Module Not Found:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### General Issues

**Environment Variables Not Loading:**
- Restart your dev server after changing `.env` files
- Make sure `.env` files are in the correct directories:
  - Frontend: `vacci-pal/.env`
  - Backend: `vacci-pal/server/.env`

## 📁 Project Structure

```
vacci-pal/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities
│   │   └── server.js       # Entry point
│   ├── .env                # Backend environment variables
│   └── package.json
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── context/           # React Context (Auth, Language)
│   ├── lib/               # Utilities, API service
│   └── pages/             # Page components
├── .env                   # Frontend environment variables
└── package.json
```

## 🔐 Security Notes

### Development
- Using `0.0.0.0/0` for MongoDB IP whitelist is OK for development
- Default JWT secret is OK for development

### Production
- ⚠️ **NEVER** use `0.0.0.0/0` for MongoDB IP whitelist
- ⚠️ **ALWAYS** use a strong, random JWT_SECRET (32+ characters)
- ⚠️ **ALWAYS** set `NODE_ENV=production`
- ⚠️ **ALWAYS** use HTTPS
- ⚠️ **NEVER** commit `.env` files to version control

## 🚀 Deployment

### Backend Deployment Options

1. **Heroku**:
   ```bash
   heroku create vaccipal-api
   heroku config:set MONGODB_URI=your_connection_string
   heroku config:set JWT_SECRET=your_secret
   git push heroku main
   ```

2. **Railway**:
   - Connect your GitHub repo
   - Add environment variables
   - Deploy automatically

3. **Render**:
   - Create new Web Service
   - Connect GitHub repo
   - Set environment variables
   - Deploy

### Frontend Deployment Options

1. **Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**:
   - Connect GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **GitHub Pages**:
   - Build: `npm run build`
   - Deploy `dist` folder

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check console logs for error messages
4. Ensure all dependencies are installed
5. Try restarting both frontend and backend servers

---

**Happy Coding! 🎉**


