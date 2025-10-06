# EduTheo - Complete Setup and Run Guide

## 🚀 Quick Start Guide

This guide will help you set up and run the complete EduTheo system - a FastAPI backend with HTML/CSS/JS frontend for MCQ practice.

## 📋 Prerequisites

Before starting, make sure you have:
- **Python 3.11+** installed
- **Git** (for version control)
- **A modern web browser** (Chrome, Firefox, Safari, Edge)
- **Terminal/Command Line** access

## 🏗️ System Architecture

```
EduTheo/
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   ├── alembic/      # Database migrations
│   └── main.py       # Entry point
├── frontend/         # HTML/CSS/JS frontend
│   ├── index.html    # Main HTML file
│   ├── styles/       # CSS files
│   └── js/           # JavaScript modules
├── scripts/          # Utility scripts
└── raw_data/         # MCQ data files
```

## 🔧 Step 1: Backend Setup

### 1.1 Configure Python Environment

```bash
# Navigate to your project directory
cd /home/ufuq_kamal/Opus/Opus_v0

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install required packages
pip install fastapi uvicorn sqlalchemy alembic python-multipart python-jose[cryptography] passlib[bcrypt] loguru
```

### 1.2 Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=sqlite:///./edutheo.db

# Security Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080", "http://127.0.0.1:8080"]

# Logging Configuration
LOG_LEVEL=INFO
EOF
```

### 1.3 Initialize Database

```bash
# Initialize Alembic (database migrations)
cd backend
alembic upgrade head
```

### 1.4 Import MCQ Data

```bash
# Run the import script to load your JSON data
cd ..
python scripts/import_questions.py
```

## 🌐 Step 2: Frontend Setup

The frontend is pure HTML/CSS/JS, so no build process is needed! However, you'll need to serve it through a web server.

### 2.1 Simple HTTP Server (Python)

The default Python HTTP server does not support the application's routing, which can cause errors when reloading the page. A simple, custom server is provided to handle this.

```bash
# Navigate to frontend directory
cd frontend

# Start the provided SPA server
python3 server.py

# If 'python3' is not found, you can try 'python'
# python server.py
```

### 2.2 Alternative: Live Server (VS Code Extension)

If you're using VS Code:
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 🚀 Step 3: Running the Complete System

### 3.1 Start the Backend (Terminal 1)

```bash
# Navigate to backend directory
cd backend

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 3.2 Start the Frontend (Terminal 2)

```bash
# Navigate to frontend directory
cd frontend

# Start frontend server
python3 server.py

# You should see:
# Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

### 3.3 Access the Application

Open your web browser and go to:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 👤 Step 4: First Login

### Option 1: Demo Account
1. Click "Demo Login" button on the login page
2. Uses credentials: `demo` / `demo123`

### Option 2: Create New Account
1. Click "Sign Up" tab
2. Fill in the registration form
3. Username, email, and password are required

## 🎯 Step 5: Using the Application

### Dashboard
- View your statistics and progress
- See recent activity and leaderboard
- Use quick practice buttons

### Practice Page
- Apply filters (chapter, difficulty, topic)
- Answer MCQ questions
- Get immediate feedback
- Track your progress

### Analytics Page
- View detailed performance metrics
- See accuracy trends and time analysis
- Export your data

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Connection refused" or API errors
```bash
# Check if backend is running
curl http://localhost:8000/health

# Expected response: {"status": "healthy"}
```

**Solutions:**
- Ensure backend server is running on port 8000
- Check for port conflicts
- Verify CORS settings in backend

#### 2. Frontend not loading properly
```bash
# Check if frontend server is running
curl http://localhost:8080

# Should return HTML content
```

**Solutions:**
- Ensure frontend server is running on port 8080
- Try a different port: `python -m http.server 3000`
- Update API base URL in `frontend/js/api.js` if needed

#### 3. Database errors
```bash
# Check if database file exists
ls -la edutheo.db

# Re-run migrations if needed
cd backend
alembic upgrade head
```

#### 4. Import script issues
```bash
# Check if JSON file exists
ls -la raw_data/9th_physics_mcqs.json

# Run import with verbose output
python scripts/import_questions.py --verbose
```

#### 5. JavaScript errors in browser
- Open Browser Developer Tools (F12)
- Check Console tab for errors
- Common issues:
  - CORS errors: Check backend CORS settings
  - 404 errors: Verify file paths
  - API errors: Check network tab

### Debug Mode

#### Backend Debug
```bash
# Run backend with debug logging
uvicorn main:app --reload --log-level debug
```

#### Frontend Debug
- Open Browser Developer Tools (F12)
- Enable verbose console logging
- Check Network tab for API calls

## 📱 Mobile Testing

The application is mobile-responsive. Test on different devices:

```bash
# Find your local IP address
# On Linux/Mac:
ip addr show
# Or: ifconfig

# On Windows:
ipconfig

# Access from mobile device using your IP:
# http://YOUR_IP_ADDRESS:8080
```

## 🔧 Advanced Configuration

### Custom Ports
```bash
# Backend on different port
uvicorn main:app --port 8001

# Frontend on different port  
python -m http.server 3000

# Update API_BASE_URL in frontend/js/api.js accordingly
```

### Production Deployment
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📁 File Structure Reference

```
Project Structure:
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── crud/         # Database operations
│   │   ├── models/       # SQLAlchemy models
│   │   └── schemas/      # Pydantic schemas
│   ├── alembic/          # Database migrations
│   └── main.py           # FastAPI application
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── styles/           # CSS stylesheets
│   └── js/               # JavaScript modules
├── scripts/
│   └── import_questions.py  # Data import script
└── raw_data/
    └── 9th_physics_mcqs.json  # Your MCQ data
```

## 🎯 Testing the System

### 1. Test Backend API
```bash
# Health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&password=test123"
```

### 2. Test Frontend
1. Open http://localhost:8080
2. Try demo login
3. Navigate through all pages
4. Test practice functionality

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs**: Backend logs will show in terminal 1
2. **Browser Console**: Open Developer Tools (F12) to see frontend errors
3. **API Documentation**: Visit http://localhost:8000/docs for API reference
4. **Test API directly**: Use the interactive docs to test endpoints

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Backend shows "Uvicorn running on http://0.0.0.0:8000"
- ✅ Frontend loads at http://localhost:8080
- ✅ Demo login works successfully
- ✅ You can navigate between pages
- ✅ Practice questions load and work properly
- ✅ No errors in browser console

## 📝 Next Steps

Once everything is running:
1. **Import your own MCQ data** by updating the JSON file
2. **Customize the styling** in the CSS files
3. **Add more features** to the JavaScript modules
4. **Deploy to production** using Docker or cloud services

---

**Note**: This is your first web application, so take it step by step. Each error is a learning opportunity! The system is designed to be beginner-friendly with comprehensive error messages and logging.