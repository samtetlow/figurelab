import React, { useState, useEffect } from 'react';
import { checkContrast, getRecommendedTextColor, suggestAccessibleColor, ContrastResult } from '../utils/wcagUtils';

interface ContrastCheckerProps {
  foregroundColor?: string;
  backgroundColor?: string;
}

export default function ContrastChecker({ foregroundColor = '#0f172a', backgroundColor = '#ffffff' }: ContrastCheckerProps) {
  const [fg, setFg] = useState(foregroundColor);
  const [bg, setBg] = useState(backgroundColor);
  const [result, setResult] = useState<ContrastResult | null>(null);
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    setFg(foregroundColor);
    setBg(backgroundColor);
  }, [foregroundColor, backgroundColor]);

  useEffect(() => {
    const contrastResult = checkContrast(fg, bg, textSize);
    setResult(contrastResult);
  }, [fg, bg, textSize]);

  const handleFixContrast = (level: 'AA' | 'AAA') => {
    const suggested = suggestAccessibleColor(fg, bg, level, textSize);
    setFg(suggested);
  };

  const handleAutoRecommend = () => {
    const recommended = getRecommendedTextColor(bg);
    setFg(recommended);
  };

  if (!result) return null;

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">♿ Accessibility Checker</h4>
        <div className="text-xs text-slate-500">WCAG 2.1</div>
      </div>

      {/* Color Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Foreground</label>
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={fg} 
              onChange={(e) => setFg(e.target.value)}
              className="h-8 w-12 border rounded cursor-pointer"
            />
            <input 
              type="text" 
              value={fg} 
              onChange={(e) => setFg(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-xs font-mono"
              placeholder="#000000"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Background</label>
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={bg} 
              onChange={(e) => setBg(e.target.value)}
              className="h-8 w-12 border rounded cursor-pointer"
            />
            <input 
              type="text" 
              value={bg} 
              onChange={(e) => setBg(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-xs font-mono"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>

      {/* Text Size Toggle */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-600">Text Size:</label>
        <button
          onClick={() => setTextSize('normal')}
          className={`px-2 py-1 rounded text-xs ${textSize === 'normal' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Normal
        </button>
        <button
          onClick={() => setTextSize('large')}
          className={`px-2 py-1 rounded text-xs ${textSize === 'large' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Large
        </button>
      </div>

      {/* Preview */}
      <div 
        className="p-4 rounded-lg text-center font-medium"
        style={{ backgroundColor: bg, color: fg }}
      >
        {textSize === 'large' ? 'Large Text Preview' : 'Normal Text Preview'}
      </div>

      {/* Results */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Contrast Ratio:</span>
          <span className="text-lg font-bold">{result.ratio}:1</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={`p-2 rounded-lg text-center text-xs font-semibold ${result.passesAA ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result.passesAA ? '✓ AA Pass' : '✗ AA Fail'}
          </div>
          <div className={`p-2 rounded-lg text-center text-xs font-semibold ${result.passesAAA ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {result.passesAAA ? '✓ AAA Pass' : '✗ AAA Fail'}
          </div>
        </div>

        {result.recommendation && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            💡 {result.recommendation}
          </div>
        )}
      </div>

      {/* Quick Fix Buttons */}
      <div className="space-y-2">
        <div className="text-xs text-slate-600 font-medium">Quick Fixes:</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleFixContrast('AA')}
            className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-100"
            disabled={result.passesAA}
          >
            Fix to AA
          </button>
          <button
            onClick={() => handleFixContrast('AAA')}
            className="px-2 py-1 rounded-lg border text-xs hover:bg-slate-100"
            disabled={result.passesAAA}
          >
            Fix to AAA
          </button>
        </div>
        <button
          onClick={handleAutoRecommend}
          className="w-full px-2 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700"
        >
          Auto: Best Text Color
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-slate-500 italic border-t pt-2">
        WCAG 2.1 requires {textSize === 'large' ? '3:1 (AA) or 4.5:1 (AAA)' : '4.5:1 (AA) or 7:1 (AAA)'} for {textSize} text.
      </div>
    </div>
  );
}

