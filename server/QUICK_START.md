# Quick Start - Running the Server

## ⚠️ Important: Configure MongoDB First

Before running the server, you need to:

1. **Create a `.env` file** in the `server` directory
2. **Add your MongoDB Atlas connection string**

## Steps to Run the Server

### 1. Create `.env` file

Create a file named `.env` in the `server` directory with the following content:

```env
PORT=5000
NODE_ENV=development

# Replace with your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vaccipal?retryWrites=true&w=majority

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=vaccipal_super_secret_jwt_key_change_this_in_production_min_32_chars_long
JWT_EXPIRY=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Get MongoDB Atlas Connection String

If you don't have MongoDB Atlas set up yet:

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (FREE tier is fine)
4. Create a database user (Database Access → Add New User)
5. Whitelist your IP (Network Access → Add IP Address → Allow from anywhere for dev)
6. Get connection string (Clusters → Connect → Connect your application)
7. Replace `<password>` and `<dbname>` in the connection string

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 4. Verify Server is Running

Open your browser and go to: `http://localhost:5000/health`

You should see:
```json
{
  "success": true,
  "message": "VacciPal API is running",
  "timestamp": "..."
}
```

## Common Issues

### "MongoDB connection error"
- Check your connection string is correct
- Verify your IP is whitelisted in MongoDB Atlas
- Make sure you replaced `<password>` with your actual password
- Wait a few minutes after creating the cluster (it takes time to provision)

### "Port 5000 already in use"
- Change `PORT=5001` in `.env` file
- Update frontend `.env` to use the new port

### "JWT_SECRET is too short"
- Generate a longer secret (32+ characters)
- You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Next Steps

Once the server is running:

1. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   cd ..
   npm run dev
   ```

3. **Test the API**:
   - Login: `POST http://localhost:5000/api/auth/login`
   - Health: `GET http://localhost:5000/health`


