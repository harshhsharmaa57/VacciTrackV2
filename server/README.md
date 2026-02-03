# VacciPal Backend API

A robust, production-ready backend service for the VacciPal vaccination tracking system built with Node.js, Express.js, and MongoDB Atlas.

## 🏗️ Architecture

- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Error Handling**: Centralized error handling middleware

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication & authorization
│   │   └── errorHandler.js      # Error handling middleware
│   ├── models/
│   │   ├── User.js              # User model (parent/doctor)
│   │   └── Child.js             # Child model with vaccine schedule
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User routes
│   │   └── children.js          # Child & vaccine routes
│   ├── scripts/
│   │   └── seedDatabase.js      # Database seeding script
│   ├── utils/
│   │   ├── generateToken.js     # JWT token generation
│   │   ├── generateAbhaId.js    # ABHA ID generation
│   │   └── vaccineSchedule.js   # NIS 2025 schedule generation
│   └── server.js                # Express app entry point
├── .env.example                 # Environment variables template
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn

### Installation

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure `.env` file**
   ```env
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Atlas Connection String
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vaccipal?retryWrites=true&w=majority
   
   # JWT Secret (use a strong random string in production)
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
   JWT_EXPIRY=7d
   
   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:5173
   ```

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a new cluster** (Free tier is sufficient for development)

3. **Create a database user**:
   - Go to Database Access
   - Add New Database User
   - Choose Password authentication
   - Save username and password

4. **Whitelist your IP**:
   - Go to Network Access
   - Add IP Address
   - For development, you can use `0.0.0.0/0` (allows all IPs - use with caution)

5. **Get connection string**:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `vaccipal` (or your preferred database name)

6. **Update `.env` file** with your MongoDB URI

### Seed Database (Optional)

Populate the database with demo data:

```bash
npm run seed
```

This will create:
- 2 parent users
- 2 doctor users
- 2 children with vaccination schedules

**Demo Credentials:**
- Parent: `parent@demo.com` / `password123`
- Doctor: `doctor@aiims.com` / `password123`

### Run the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`)

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "parent",
  "phone": "+91 98765 43210",
  "hospitalName": "Hospital Name" // Optional, required for doctors
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

### Users

#### Get Current User
```http
GET /api/users/me
Authorization: Bearer <token>
```

### Children

#### Get All Children
```http
GET /api/children
Authorization: Bearer <token>
```

- **Parents**: Returns only their own children
- **Doctors**: Returns all children

#### Search Children (Doctors Only)
```http
GET /api/children/search?q=search_term
Authorization: Bearer <token>
```

#### Get Single Child
```http
GET /api/children/:id
Authorization: Bearer <token>
```

#### Create Child
```http
POST /api/children
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Child Name",
  "dateOfBirth": "2024-01-15",
  "gender": "male",
  "parentId": "parent_id_here" // Optional for doctors
}
```

**Note**: Vaccine schedule is automatically generated based on date of birth.

#### Update Vaccine Status (Doctors Only)
```http
PUT /api/children/:id/vaccines/:vaccineId
Authorization: Bearer <token>
Content-Type: application/json

{
  "administeredDate": "2024-01-20" // Optional, defaults to current date
}
```

### Health Check

```http
GET /health
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 7 days (configurable via `JWT_EXPIRY`).

## 🛡️ Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configured for frontend origin
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Express Validator
- **JWT**: Secure token-based authentication
- **Role-Based Access Control**: Parent/Doctor role enforcement

## 🧪 Testing the API

### Using cURL

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "parent"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get children (replace TOKEN with actual token):**
```bash
curl -X GET http://localhost:5000/api/children \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables:
   - `base_url`: `http://localhost:5000`
   - `token`: (set after login)
3. Use the token in Authorization header for protected routes

## 🐛 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRY` | JWT expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🚀 Deployment

### Production Checklist

1. ✅ Set `NODE_ENV=production`
2. ✅ Use a strong `JWT_SECRET` (32+ characters, random)
3. ✅ Configure proper CORS origins
4. ✅ Set up MongoDB Atlas IP whitelist
5. ✅ Enable MongoDB Atlas backups
6. ✅ Use environment variables (never commit `.env`)
7. ✅ Set up monitoring and logging
8. ✅ Configure rate limiting appropriately
9. ✅ Use HTTPS in production

### Deployment Platforms

- **Heroku**: Easy deployment with MongoDB Atlas addon
- **Railway**: Simple Node.js deployment
- **Render**: Free tier available
- **AWS EC2**: Full control
- **DigitalOcean App Platform**: Managed platform

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [JWT.io](https://jwt.io/) - JWT token decoder

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write clear commit messages
5. Test all endpoints before submitting

## 📄 License

MIT License

---

**Built with ❤️ for better healthcare tracking**

