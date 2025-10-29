// services/aiService.ts - Backend-powered AI Integration for Natural Language Editing

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
  message?: string;
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
 * AI Service for natural language diagram editing (uses backend API)
 */
export class AIService {
  private backendUrl: string;

  constructor(backendUrl: string = 'http://localhost:3001') {
    this.backendUrl = backendUrl;
  }

  /**
   * Process a natural language command and return edit actions
   */
  async processCommand(command: string, canvasState: CanvasState): Promise<AIEditResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ai/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command,
          canvasState
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `API request failed: ${response.statusText}`);
      }

      return await response.json();

    } catch (error: any) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        actions: [],
        error: error.message || 'Failed to connect to AI service. Make sure the backend server is running.'
      };
    }
  }

  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Validate API key (no longer needed - backend handles this)
   */
  static validateApiKey(apiKey: string): boolean {
    return true; // Always true since backend handles API key
  }
}

/**
 * Create a singleton instance
 */
let aiServiceInstance: AIService | null = null;

export function initializeAIService(config?: { backendUrl?: string }): AIService {
  aiServiceInstance = new AIService(config?.backendUrl);
  return aiServiceInstance;
}

export function getAIService(): AIService | null {
  return aiServiceInstance;
}
