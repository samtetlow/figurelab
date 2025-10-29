import React, { useState } from 'react';
import { AIService, AIEditRequest, AIEditResponse, CanvasState } from '../services/aiService';

interface AICommandPanelProps {
  aiService: AIService | null;
  currentState: CanvasState;
  selectedShapes: string[];
  onExecuteActions: (response: AIEditResponse) => void;
  onConfigureAPI: () => void;
}

export default function AICommandPanel({
  aiService,
  currentState,
  selectedShapes,
  onExecuteActions,
  onConfigureAPI
}: AICommandPanelProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIEditResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const exampleCommands = [
    'Create a blue rectangle in the center',
    'Make the selected shape larger',
    'Change all circles to red',
    'Align selected shapes horizontally',
    'Add a text box that says "Hello World"',
    'Group the selected shapes',
    'Move everything to the right by 50 pixels'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !aiService) return;

    setIsProcessing(true);
    setLastResponse(null);

    try {
      const request: AIEditRequest = {
        command: command.trim(),
        currentState,
        selectedShapes: selectedShapes.length > 0 ? selectedShapes : undefined
      };

      const response = await aiService.processCommand(request);
      setLastResponse(response);

      if (response.success && response.actions.length > 0) {
        onExecuteActions(response);
        setHistory(prev => [command, ...prev.slice(0, 9)]); // Keep last 10
        setCommand('');
      }
    } catch (error: any) {
      setLastResponse({
        success: false,
        actions: [],
        error: error.message || 'An error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setCommand(example);
  };

  if (!aiService) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-1">AI Assistant</h4>
            <p className="text-sm text-amber-800 mb-3">
              Enable natural language editing by configuring your OpenAI API key.
            </p>
            <button
              onClick={onConfigureAPI}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
            >
              Configure API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h4 className="font-semibold">AI Assistant</h4>
        </div>
        <button
          onClick={onConfigureAPI}
          className="text-xs text-blue-600 hover:text-blue-800"
          title="Change API key"
        >
          ⚙️
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Describe what you want to do... (e.g., 'Create a blue circle' or 'Make it bigger')"
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            disabled={isProcessing}
          />
          {command && (
            <button
              type="button"
              onClick={() => setCommand('')}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!command.trim() || isProcessing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '🔄 Processing...' : '✨ Execute Command'}
        </button>
      </form>

      {lastResponse && (
        <div className={`p-3 rounded-lg text-sm ${lastResponse.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {lastResponse.success ? (
            <>
              <div className="font-medium text-green-900 mb-1">✓ Success</div>
              {lastResponse.explanation && (
                <div className="text-green-800">{lastResponse.explanation}</div>
              )}
              <div className="text-xs text-green-700 mt-1">
                {lastResponse.actions.length} action(s) executed
              </div>
            </>
          ) : (
            <>
              <div className="font-medium text-red-900 mb-1">✗ Error</div>
              <div className="text-red-800">{lastResponse.error}</div>
            </>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-1">Recent commands:</div>
          <div className="space-y-1">
            {history.slice(0, 3).map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => setCommand(cmd)}
                className="w-full text-left px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100 rounded border truncate"
                title={cmd}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-slate-500 mb-1">Try these examples:</div>
        <div className="space-y-1">
          {exampleCommands.slice(0, 4).map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example)}
              className="w-full text-left px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded truncate"
              title={example}
            >
              💡 {example}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-400 italic pt-2 border-t">
        Powered by ChatGPT-5 (or GPT-4). Natural language understanding for diagram editing.
      </div>
    </div>
  );
}

