# 🎨 FigureLab

**Professional figure and diagram editor with AI-powered natural language editing**

A modern, in-browser diagram editor built with React + Konva, featuring advanced shape manipulation, AI-assisted editing, accessibility checks, and professional export options.

---

## ✨ Features

### 🖼️ Shape & Drawing Tools
- **Shapes**: Rectangle, Circle, Line, Arrow, Text, Image
- **Vector Point Editing**: Bezier curves and path manipulation
- **Group/Ungroup**: Organize complex diagrams
- **Layering**: Bring to front/back, forward/backward

### 🎨 Advanced Styling
- **Attribute Editors**: Opacity, gradients, filters, effects
- **Color System**: Full support for Hex, RGB, CMYK, HSL conversions
- **Quick Style Presets**: Ghost, Bold, Flat, Outline modes

### ♿ Accessibility & Compliance
- **WCAG 2.1 Contrast Checker**: AA/AAA compliance validation
- **Real-time contrast ratio analysis**
- **Auto-fix suggestions** for accessible color combinations
- **Legal disclaimer** with user acceptance tracking

### 🤖 AI-Powered Editing
- **Natural Language Commands**: "Create a blue circle" or "Make it bigger"
- **ChatGPT-5 Integration**: Intelligent shape manipulation
- **Context-aware actions**: Understands selected shapes and current state

### 🛠️ Professional Tools
- **Multi-select**: Shift/Cmd click or marquee selection
- **Alignment Tools**: Left, right, center, top, bottom, distribute
- **Grid & Snap**: Precise positioning with customizable grid
- **Connectors**: Orthogonal routing between shapes

### 💾 Export & Save
- **PNG Export**: High-quality raster output
- **SVG Export**: Clean, optimized, XSS-protected vectors
- **PPTX Export**: PowerPoint-compatible presentations
- **JSON Projects**: Save and load complete diagrams

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + D`: Duplicate
- `Ctrl/Cmd + G`: Group (Shift + G to ungroup)
- `Arrow Keys`: Nudge (hold Shift for grid step)
- `Delete`: Remove selected
-

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 AI Setup

1. Click the **⚙️ Configure API Key** button in the AI Assistant panel
2. Enter your OpenAI API key (starts with `sk-`)
3. Start using natural language commands!

Example commands:
- "Create a blue rectangle in the center"
- "Make all circles red"
- "Align selected shapes horizontally"
- "Add a text box that says Hello World"

---

## 🎯 Architecture

### Tech Stack
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Konva**: HTML5 Canvas library for graphics
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling

### Project Structure
```
figurelab/
├── src/
│   ├── components/          # React components
│   │   ├── DisclaimerDialog.tsx
│   │   ├── AttributeEditor.tsx
│   │   ├── ContrastChecker.tsx
│   │   └── AICommandPanel.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useHistory.ts    # Undo/redo system
│   ├── services/            # Business logic
│   │   └── aiService.ts     # ChatGPT integration
│   ├── utils/               # Utility functions
│   │   ├── colorUtils.ts    # Color conversions
│   │   ├── wcagUtils.ts     # Accessibility checks
│   │   └── svgExport.ts     # SVG generation
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Security & Privacy

- **XSS Protection**: All SVG exports are sanitized
- **Input Validation**: Malicious URLs and scripts are blocked
- **Local Storage**: API keys stored securely in browser
- **Legal Compliance**: User acceptance tracking with timestamps

---

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Note**: Modern browsers with ES2020 support required.

---

## 📊 Code Stats

- **~10,000+** lines of production code
- **~3,800** lines of backend logic (TypeScript/React)
- **~2,500** lines of utilities and services
- **~2,000** lines of UI components
- **100%** TypeScript coverage

---

## 🤝 Contributing

This is a proprietary project. For questions or issues, contact the maintainer.

---

## 📝 License

Copyright © 2025 FigureLab. All rights reserved.

---

## 🎓 Usage Tips

### Getting Started
1. Accept the legal disclaimer
2. Create shapes using the toolbar buttons
3. Select and transform shapes with the Transformer tool
4. Use the Inspector panel to fine-tune properties
5. Export your work in your preferred format

### Best Practices
- **Use Groups**: Organize related shapes for easier manipulation
- **Check Accessibility**: Use the WCAG checker for text/background combinations
- **Save Often**: Export JSON projects to preserve your work
- **Try AI**: Let ChatGPT help with complex tasks

### Performance Tips
- Keep projects under 500 shapes for optimal performance
- Use groups to reduce individual shape management
- Export large canvases as PNG for better performance than SVG

---

## 📞 Support

For technical support or feature requests, please contact the development team.

**Built with ❤️ using React + Konva**
