// services/aiService.ts - ChatGPT-5 Integration for Natural Language Editing

export interface AIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export interface ShapeDescription {
  type: string;
  id: string;
  properties: Record<string, any>;
}

export interface CanvasState {
  shapes: ShapeDescription[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface AIEditRequest {
  command: string;
  currentState: CanvasState;
  selectedShapes?: string[];
}

export interface AIEditResponse {
  success: boolean;
  actions: EditAction[];
  explanation?: string;
  error?: string;
}

export type EditActionType = 
  | 'create' 
  | 'modify' 
  | 'delete' 
  | 'move' 
  | 'resize' 
  | 'recolor' 
  | 'group' 
  | 'ungroup'
  | 'align'
  | 'distribute';

export interface EditAction {
  type: EditActionType;
  shapeId?: string;
  shapeType?: string;
  properties?: Record<string, any>;
  targetIds?: string[];
}

/**
 * AI Service for natural language diagram editing
 */
export class AIService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4'; // Will use GPT-5 when available
    this.maxTokens = config.maxTokens || 2000;
  }

  /**
   * Process a natural language command and return edit actions
   */
  async processCommand(request: AIEditRequest): Promise<AIEditResponse> {
    try {
      if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
        return {
          success: false,
          actions: [],
          error: 'Please configure your OpenAI API key in the settings.'
        };
      }

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: this.maxTokens,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      let result: AIEditResponse;
      try {
        result = JSON.parse(content);
      } catch (e) {
        // Fallback parsing
        result = {
          success: false,
          actions: [],
          error: 'Failed to parse AI response'
        };
      }

      return result;

    } catch (error: any) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        actions: [],
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Build the system prompt that defines the AI's role
   */
  private buildSystemPrompt(): string {
    return `You are an AI assistant that helps users edit diagrams using natural language commands. 

Your role:
1. Interpret the user's command in the context of their current diagram
2. Generate structured edit actions (create, modify, delete, move, resize, recolor, etc.)
3. Be smart about inferring intent (e.g., "make it blue" should apply to selected shapes)
4. Provide clear explanations of what you're doing

Available shape types: rect, circle, line, arrow, text, image, group

Available actions:
- create: Add new shapes
- modify: Change shape properties (color, size, text, etc.)
- delete: Remove shapes
- move: Change position
- resize: Change dimensions
- recolor: Change fill/stroke colors
- group: Combine multiple shapes
- ungroup: Separate grouped shapes
- align: Align shapes (left, right, center, top, bottom)
- distribute: Space shapes evenly

Respond ONLY with valid JSON in this format:
{
  "success": true,
  "actions": [
    {
      "type": "create|modify|delete|move|resize|recolor|group|ungroup|align|distribute",
      "shapeId": "optional-existing-shape-id",
      "shapeType": "rect|circle|line|arrow|text|image",
      "properties": {
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 150,
        "fill": "#ff0000",
        "stroke": "#000000",
        "text": "example",
        "rotation": 45
      },
      "targetIds": ["id1", "id2"]
    }
  ],
  "explanation": "I created a red rectangle at position (100, 100) with size 200x150."
}

Be creative and helpful. Make reasonable assumptions when details are missing.`;
  }

  /**
   * Build the user prompt with current state and command
   */
  private buildUserPrompt(request: AIEditRequest): string {
    const { command, currentState, selectedShapes } = request;

    let prompt = `Current canvas state:\n`;
    prompt += `Canvas size: ${currentState.canvasWidth}x${currentState.canvasHeight}\n`;
    prompt += `Number of shapes: ${currentState.shapes.length}\n\n`;

    if (selectedShapes && selectedShapes.length > 0) {
      prompt += `Selected shapes (${selectedShapes.length}):\n`;
      currentState.shapes
        .filter(s => selectedShapes.includes(s.id))
        .forEach(shape => {
          prompt += `- ${shape.type} (id: ${shape.id}): ${JSON.stringify(shape.properties)}\n`;
        });
      prompt += '\n';
    }

    if (currentState.shapes.length > 0 && currentState.shapes.length <= 10) {
      prompt += `All shapes:\n`;
      currentState.shapes.forEach(shape => {
        prompt += `- ${shape.type} (id: ${shape.id}): ${JSON.stringify(shape.properties)}\n`;
      });
      prompt += '\n';
    }

    prompt += `User command: "${command}"\n\n`;
    prompt += `Please interpret this command and return the appropriate edit actions.`;

    return prompt;
  }

  /**
   * Validate API key
   */
  static validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-') && apiKey.length > 20;
  }
}

/**
 * Create a singleton instance (will be initialized with API key from user)
 */
let aiServiceInstance: AIService | null = null;

export function initializeAIService(config: AIConfig): AIService {
  aiServiceInstance = new AIService(config);
  return aiServiceInstance;
}

export function getAIService(): AIService | null {
  return aiServiceInstance;
}

