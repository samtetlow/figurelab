# FigureLab Backend Server

Backend API server for FigureLab that handles AI diagram generation using OpenAI's API.

## 🚀 Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
# .env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

**Get your OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste it into the `.env` file

### 3. Start the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3001`

---

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "aiEnabled": true
}
```

### Process AI Command
```
POST /api/ai/process
```

**Request Body:**
```json
{
  "command": "Create a blue circle in the center",
  "canvasState": {
    "shapes": [],
    "canvasWidth": 1200,
    "canvasHeight": 800
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "I created a blue circle at the center of the canvas.",
  "actions": [
    {
      "type": "create",
      "shapeType": "circle",
      "properties": {
        "x": 600,
        "y": 400,
        "radius": 80,
        "fill": "#3b82f6"
      }
    }
  ]
}
```

---

## 🔧 How It Works

1. **Frontend** sends user commands to the backend
2. **Backend** processes the command with OpenAI API
3. **OpenAI** returns structured actions
4. **Backend** sends actions back to frontend
5. **Frontend** executes actions on the canvas

This architecture:
- ✅ Keeps API keys secure (server-side only)
- ✅ Prevents CORS issues
- ✅ Allows for caching and rate limiting
- ✅ Enables backend logging and monitoring

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Try a different port in `.env`: `PORT=3002`

### AI features not working
- Verify `OPENAI_API_KEY` is set correctly in `.env`
- Check server logs for error messages
- Ensure you have API credits in your OpenAI account

### CORS errors
- Make sure the server is running on `http://localhost:3001`
- Check that frontend is connecting to the correct URL

---

## 📦 Dependencies

- **express** - Web framework
- **cors** - Enable cross-origin requests
- **dotenv** - Environment variable management
- **openai** - OpenAI API client

---

## 🔐 Security Notes

- ⚠️ **Never commit `.env` file to git**
- ⚠️ **Keep your OpenAI API key secure**
- ⚠️ **Use environment variables in production**
- ⚠️ **Consider adding rate limiting for production use**

---

## 📝 License

Same as FigureLab main project

