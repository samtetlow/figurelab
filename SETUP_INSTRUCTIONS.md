# 🚀 FigureLab Setup Instructions

## Quick Start Guide

### ✅ **Step 1: Configure OpenAI API Key**

Create a `.env` file in the `server` directory:

```bash
cd /Users/samtetlow/Cursor/figurelab/server
```

Create the file:
```bash
cat > .env << EOF
OPENAI_API_KEY=your_actual_openai_api_key_here
PORT=3001
EOF
```

**Replace `your_actual_openai_api_key_here` with your actual OpenAI API key!**

Or use a text editor:
```bash
nano .env
```

Then add:
```
OPENAI_API_KEY=sk-proj-...your-key-here...
PORT=3001
```

---

### ✅ **Step 2: Start the Backend Server**

Open a **NEW terminal window** and run:

```bash
cd /Users/samtetlow/Cursor/figurelab/server
npm start
```

You should see:
```
🚀 FigureLab backend running on http://localhost:3001
AI service: ✅ Enabled
```

Keep this terminal running!

---

### ✅ **Step 3: Start the Frontend**

In your **ORIGINAL terminal**, run:

```bash
cd /Users/samtetlow/Cursor/figurelab
npm run dev
```

You should see:
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

### ✅ **Step 4: Open in Browser**

Navigate to: **http://localhost:5173**

---

## 🎨 How to Use

### **With AI (Conversational)**:
1. Look at the left sidebar - you'll see the AI chat panel
2. Type commands like:
   - "Create a blue circle in the center"
   - "Add a rectangle to the left"
   - "Connect them with an arrow"
   - "Make everything 50% bigger"
3. Press Enter or click Send
4. Watch the canvas update in real-time!

### **Manual Mode**:
- Use the Quick Add buttons (📐 Rectangle, ⭕ Circle, etc.)
- Drag shapes on the canvas
- Select and edit in the Inspector panel
- Export when done (PNG, SVG, PowerPoint)

---

## 🐛 Troubleshooting

### **"AI service not working"**
- ✅ Make sure backend server is running (Step 2)
- ✅ Check console for errors (F12 in browser)
- ✅ Verify `.env` file has correct API key

### **"Connection refused"**
- ✅ Backend must be running on port 3001
- ✅ Frontend must be running on port 5173
- ✅ Both need to be running simultaneously

### **"API key invalid"**
- ✅ Check that the API key in `.env` starts with `sk-`
- ✅ Verify the key is still valid at https://platform.openai.com/api-keys
- ✅ Restart the backend server after changing `.env`

---

## 📦 Architecture

```
┌─────────────────────┐
│   Browser (5173)    │
│   ┌─────────────┐   │
│   │  FigureLab  │   │ 
│   │   Frontend  │   │
│   └──────┬──────┘   │
└──────────┼──────────┘
           │
           │ HTTP Requests
           │
           ▼
┌──────────────────────┐
│  Backend (3001)      │
│  ┌────────────────┐  │
│  │  Express API   │  │
│  └────────┬───────┘  │
└───────────┼──────────┘
            │
            │ API Calls
            │
            ▼
    ┌──────────────┐
    │   OpenAI     │
    │     API      │
    └──────────────┘
```

**Benefits**:
- ✅ API keys stay secure on the server
- ✅ No CORS issues
- ✅ Easier to add caching/rate limiting
- ✅ Better error handling

---

## 🎯 What's Changed

### **Before** (v1.0):
- API key required on frontend
- Direct OpenAI API calls from browser
- Security risk (exposed API keys)

### **After** (v2.0):
- No API key needed on frontend
- Backend handles all AI requests
- Secure, production-ready architecture

---

## ✨ Next Steps

Once everything is running:
1. Accept the disclaimer
2. Try creating shapes with AI commands
3. Explore manual editing tools
4. Export your diagrams

---

**Need help?** Check the browser console (F12) for detailed error messages.

