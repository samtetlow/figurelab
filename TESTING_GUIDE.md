# Testing Guide for the Platform

## 🧪 Quick Test Steps

### ✅ **Step 1: Verify Both Servers Are Running**

**Check Backend:**
```bash
curl http://localhost:3001/api/health
```
Expected: `{"status":"healthy","aiEnabled":true}`

**Check Frontend:**
```bash
curl -s http://localhost:5173 | head -5
```
Expected: HTML with "FigureLab"

---

### ✅ **Step 2: Open the Platform in Browser**

1. Open: **http://localhost:5173**
2. **Hard refresh** to clear cache: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Accept the disclaimer (enter your name)

---

### ✅ **Step 3: Test Manual Shape Creation**

Click these buttons (top toolbar):
- `📐 Rectangle` - Should create a gray rectangle
- `⭕ Circle` - Should create a purple circle  
- `📏 Line` - Should create a black line
- `➡️ Arrow` - Should create an arrow
- `📝 Text` - Should create editable text

**If shapes DON'T appear:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check if shapes array is updating (React DevTools)

---

### ✅ **Step 4: Test AI Shape Creation**

In the **left sidebar chat**, type:
```
Create a blue circle
```

Press Enter.

**Expected Result:**
1. AI responds: "Created a blue circle on the canvas"
2. A blue circle appears on the canvas
3. Message shows "✓ Applied 1 action(s)"

**If NOT working:**
1. Check browser console for errors
2. Check Network tab - look for POST to `/api/ai/process`
3. Verify response JSON has `success: true` and `actions` array

---

### ✅ **Step 5: Test AI Backend Directly**

Run this in terminal:
```bash
curl -X POST http://localhost:3001/api/ai/process \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Create a red rectangle",
    "canvasState": {
      "shapes": [],
      "canvasWidth": 1200,
      "canvasHeight": 800
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Created a red rectangle...",
  "actions": [{
    "type": "create",
    "shapeType": "rect",
    "properties": {...}
  }]
}
```

---

## 🐛 Troubleshooting

### Problem: "Shapes don't appear on canvas"

**Solution 1: Clear Browser Cache**
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

**Solution 2: Check React State**
```
1. Install React DevTools extension
2. Open DevTools > Components tab
3. Find <App> component
4. Check if `shapes` state is updating
```

**Solution 3: Check Console Errors**
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share error message if any
```

### Problem: "AI chat not responding"

**Check 1: Backend Connection**
```bash
curl http://localhost:3001/api/health
```

**Check 2: CORS Errors**
- Open browser console
- Look for "CORS" or "blocked" errors
- Backend should allow `http://localhost:5173`

**Check 3: AI Service Initialized**
- Check console for: "AI backend not available"
- Backend must be running first before frontend

### Problem: "Backend not starting"

**Check .env file exists:**
```bash
ls -la /Users/samtetlow/Cursor/figurelab/server/.env
```

**Check .env contains API key:**
```bash
cat /Users/samtetlow/Cursor/figurelab/server/.env
```

**Restart backend:**
```bash
cd /Users/samtetlow/Cursor/figurelab/server
npm start
```

---

## 📊 Expected Behavior

### **Manual Creation (Quick Add Buttons)**
1. Click button
2. Shape appears immediately on canvas
3. Shape is selected (blue outline)
4. Can drag shape around
5. Inspector shows shape properties

### **AI Creation (Chat Interface)**
1. Type command in chat
2. Press Enter
3. "Thinking..." indicator appears
4. AI responds with confirmation
5. Shape(s) appear on canvas
6. "✓ Applied N action(s)" shown

### **Both Methods Should:**
- ✅ Create shapes visible on canvas
- ✅ Allow dragging shapes
- ✅ Show selection outline
- ✅ Update Inspector panel
- ✅ Support undo/redo
- ✅ Allow export (PNG/SVG/PPTX)

---

## 🔍 Debugging Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Browser shows the Platform UI
- [ ] No console errors in browser
- [ ] Manual buttons create shapes
- [ ] AI chat responds to commands
- [ ] Shapes appear on canvas
- [ ] Can drag and edit shapes
- [ ] Export buttons work

---

## 💡 Quick Fixes

### **Nothing works:**
```bash
# Kill all processes
pkill -f "node.*figurelab"

# Restart backend
cd /Users/samtetlow/Cursor/figurelab/server
npm start &

# Restart frontend (new terminal)
cd /Users/samtetlow/Cursor/figurelab
npm run dev
```

### **AI not working but manual is:**
- Check backend is running
- Check browser console for fetch errors
- Verify OpenAI API key in server/.env

### **Manual not working:**
- Hard refresh browser (Cmd+Shift+R)
- Check for JSX/TypeScript errors in terminal
- Check shapes state in React DevTools

---

## ✅ Success Indicators

You'll know the Platform is working when:

1. ✅ Click Rectangle → Gray rect appears
2. ✅ Click Circle → Purple circle appears  
3. ✅ Type "create blue circle" → Blue circle appears
4. ✅ Shapes can be dragged
5. ✅ Undo button works
6. ✅ Export PNG downloads file

---

**Need Help?**
1. Check browser console (F12)
2. Check backend terminal output
3. Check frontend terminal output
4. Share error messages

