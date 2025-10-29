import React, { useState } from 'react';

interface GradientStop {
  offset: number;
  color: string;
}

interface LinearGradient {
  type: 'linear';
  angle: number;
  stops: GradientStop[];
}

interface RadialGradient {
  type: 'radial';
  stops: GradientStop[];
}

type Gradient = LinearGradient | RadialGradient;

interface AttributeEditorProps {
  shapeId: string;
  currentFill?: string;
  currentStroke?: string;
  currentOpacity?: number;
  currentStrokeWidth?: number;
  onUpdate: (updates: any) => void;
}

export default function AttributeEditor({
  shapeId,
  currentFill = '#f8fafc',
  currentStroke = '#0f172a',
  currentOpacity = 1,
  currentStrokeWidth = 2,
  onUpdate
}: AttributeEditorProps) {
  const [showGradient, setShowGradient] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [blur, setBlur] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const applyFilters = () => {
    // In a real implementation, we'd apply CSS filters or SVG filters
    // For now, we'll just adjust opacity as a demonstration
    const effectiveOpacity = currentOpacity * (brightness / 100);
    onUpdate({ opacity: Math.max(0.05, Math.min(1, effectiveOpacity)) });
  };

  return (
    <div className="space-y-4">
      {/* Basic Attributes */}
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Colors</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm">
            Fill
            <input 
              type="color" 
              className="h-8 w-12 border rounded cursor-pointer" 
              value={currentFill} 
              onChange={(e) => onUpdate({ fill: e.target.value })} 
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            Stroke
            <input 
              type="color" 
              className="h-8 w-12 border rounded cursor-pointer" 
              value={currentStroke} 
              onChange={(e) => onUpdate({ stroke: e.target.value })} 
            />
          </label>
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <label className="block text-xs uppercase tracking-wide text-slate-500 mb-2">
          Stroke Width: {currentStrokeWidth}px
        </label>
        <input 
          type="range" 
          min={0} 
          max={20} 
          step={0.5} 
          value={currentStrokeWidth} 
          onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs uppercase tracking-wide text-slate-500 mb-2">
          Opacity: {Math.round(currentOpacity * 100)}%
        </label>
        <input 
          type="range" 
          min={0.05} 
          max={1} 
          step={0.05} 
          value={currentOpacity} 
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Gradient Section */}
      <div>
        <button
          onClick={() => setShowGradient(!showGradient)}
          className="w-full text-left text-xs uppercase tracking-wide text-slate-500 mb-2 flex items-center justify-between hover:text-slate-700"
        >
          <span>🎨 Gradients</span>
          <span>{showGradient ? '▼' : '▶'}</span>
        </button>
        {showGradient && (
          <div className="pl-2 space-y-2 text-sm">
            <button 
              onClick={() => {
                // Apply a simple two-color linear gradient
                const gradient = `linear-gradient(45deg, ${currentFill}, ${currentStroke})`;
                // Note: Konva doesn't support CSS gradients directly
                // This would need to be implemented with Konva's gradient system
                alert('Gradient feature coming soon! Will use Konva\'s native gradient API.');
              }}
              className="w-full px-3 py-2 rounded-lg border hover:bg-slate-50"
            >
              Apply Linear Gradient
            </button>
            <button 
              onClick={() => {
                alert('Radial gradient feature coming soon!');
              }}
              className="w-full px-3 py-2 rounded-lg border hover:bg-slate-50"
            >
              Apply Radial Gradient
            </button>
            <div className="text-xs text-slate-500 italic">
              Tip: Gradients will blend your fill and stroke colors
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full text-left text-xs uppercase tracking-wide text-slate-500 mb-2 flex items-center justify-between hover:text-slate-700"
        >
          <span>✨ Filters & Effects</span>
          <span>{showFilters ? '▼' : '▶'}</span>
        </button>
        {showFilters && (
          <div className="pl-2 space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Blur: {blur}px
              </label>
              <input 
                type="range" 
                min={0} 
                max={20} 
                step={1} 
                value={blur} 
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Brightness: {brightness}%
              </label>
              <input 
                type="range" 
                min={0} 
                max={200} 
                step={5} 
                value={brightness} 
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Contrast: {contrast}%
              </label>
              <input 
                type="range" 
                min={0} 
                max={200} 
                step={5} 
                value={contrast} 
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Saturation: {saturation}%
              </label>
              <input 
                type="range" 
                min={0} 
                max={200} 
                step={5} 
                value={saturation} 
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={applyFilters}
              className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Apply Filters
            </button>

            <button
              onClick={() => {
                setBlur(0);
                setBrightness(100);
                setContrast(100);
                setSaturation(100);
                onUpdate({ opacity: 1 });
              }}
              className="w-full px-3 py-2 rounded-lg border text-sm hover:bg-slate-50"
            >
              Reset All Filters
            </button>

            <div className="text-xs text-slate-500 italic mt-2">
              Note: Advanced filters are being refined for Konva canvas rendering
            </div>
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Quick Styles</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate({ opacity: 0.3, strokeWidth: 1 })}
            className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-50"
            title="Light, subtle appearance"
          >
            🌫️ Ghost
          </button>
          <button
            onClick={() => onUpdate({ opacity: 1, strokeWidth: 4 })}
            className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-50"
            title="Bold, prominent appearance"
          >
            💪 Bold
          </button>
          <button
            onClick={() => onUpdate({ opacity: 1, stroke: 'none', strokeWidth: 0 })}
            className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-50"
            title="No stroke, fill only"
          >
            🎨 Flat
          </button>
          <button
            onClick={() => onUpdate({ fill: 'none', strokeWidth: 2 })}
            className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-50"
            title="Outline only, no fill"
          >
            ⭕ Outline
          </button>
        </div>
      </div>
    </div>
  );
}

