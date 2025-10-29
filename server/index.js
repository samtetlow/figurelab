import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', aiEnabled: !!process.env.OPENAI_API_KEY });
});

// AI diagram generation endpoint
app.post('/api/ai/process', async (req, res) => {
  try {
    const { command, canvasState } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }

    // Build the system prompt
    const systemPrompt = `You are an AI assistant that helps create and edit diagrams. You receive natural language commands and canvas state, then return structured actions to modify the canvas.

Available shape types: rect, circle, line, arrow, text, image, group

Available actions:
- create: Add new shapes
- modify: Change properties (x, y, width, height, fill, stroke, etc.)
- delete: Remove shapes
- group/ungroup: Organize shapes
- align: Position shapes (left, right, top, bottom, hcenter, vcenter)
- recolor: Change colors
- resize: Change dimensions
- move: Reposition shapes

Always respond with valid JSON in this format:
{
  "success": true,
  "message": "Description of what you did",
  "actions": [
    {
      "type": "create",
      "shapeType": "rect",
      "properties": { "x": 100, "y": 100, "width": 200, "height": 150, "fill": "#3b82f6" }
    }
  ]
}`;

    // Build the user prompt with canvas context
    const userPrompt = `Current canvas state:
- Canvas size: ${canvasState.canvasWidth}x${canvasState.canvasHeight}
- Number of shapes: ${canvasState.shapes?.length || 0}
- Shapes: ${JSON.stringify(canvasState.shapes || [], null, 2)}

User command: "${command}"

Please generate appropriate actions to fulfill this command.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content;
    const aiResponse = JSON.parse(responseText);

    res.json(aiResponse);
  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred processing your request',
      actions: []
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 FigureLab backend running on http://localhost:${PORT}`);
  console.log(`AI service: ${process.env.OPENAI_API_KEY ? '✅ Enabled' : '❌ Disabled (set OPENAI_API_KEY)'}`);
});

