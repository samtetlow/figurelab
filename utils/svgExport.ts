// utils/svgExport.ts - Clean, optimized SVG export with XSS protection

export interface SVGExportOptions {
  width: number;
  height: number;
  background?: string;
  includeMetadata?: boolean;
  prettify?: boolean;
  sanitize?: boolean;
}

/**
 * Escapes HTML/XML special characters to prevent XSS
 */
export function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitizes URLs to prevent javascript: and data: URI XSS attacks
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  const lowercaseURL = url.toLowerCase().trim();
  
  // Block dangerous protocols
  if (
    lowercaseURL.startsWith('javascript:') ||
    lowercaseURL.startsWith('data:text/html') ||
    lowercaseURL.startsWith('vbscript:')
  ) {
    console.warn('[SVG Export] Blocked potentially malicious URL:', url);
    return '';
  }
  
  return escapeXML(url);
}

/**
 * Formats a number to a clean string (removes unnecessary decimals)
 */
export function formatNumber(num: number, decimals: number = 2): string {
  const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return rounded.toString();
}

/**
 * Converts a color to hex format, handling various input formats
 */
export function normalizeColor(color: string | undefined): string {
  if (!color) return 'none';
  
  // Already hex
  if (color.startsWith('#')) return color;
  
  // RGB/RGBA
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10).toString(16).padStart(2, '0');
      const g = parseInt(match[1], 10).toString(16).padStart(2, '0');
      const b = parseInt(match[2], 10).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  
  return escapeXML(color);
}

/**
 * Creates a clean, optimized SVG string
 */
export function createSVG(options: SVGExportOptions, content: string[]): string {
  const { width, height, background, includeMetadata, prettify, sanitize } = options;
  
  const indent = prettify ? '  ' : '';
  const newline = prettify ? '\n' : '';
  
  const parts: string[] = [];
  
  // XML declaration
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  if (prettify) parts.push('\n');
  
  // SVG root element with proper namespaces
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${formatNumber(width)}" ` +
    `height="${formatNumber(height)}" ` +
    `viewBox="0 0 ${formatNumber(width)} ${formatNumber(height)}" ` +
    `version="1.1">`
  );
  parts.push(newline);
  
  // Metadata
  if (includeMetadata) {
    parts.push(indent + '<title>FigureLab Export</title>');
    parts.push(newline);
    parts.push(indent + '<desc>Created with FigureLab - ' + new Date().toISOString() + '</desc>');
    parts.push(newline);
  }
  
  // Definitions (for reusable elements like gradients, markers)
  parts.push(indent + '<defs>');
  parts.push(newline);
  
  // Arrow marker for arrows and connectors
  parts.push(indent + indent + '<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">');
  parts.push(newline);
  parts.push(indent + indent + indent + '<path d="M0,0 L0,6 L9,3 z" fill="context-stroke"/>');
  parts.push(newline);
  parts.push(indent + indent + '</marker>');
  parts.push(newline);
  parts.push(indent + '</defs>');
  parts.push(newline);
  
  // Background
  if (background && background !== 'transparent' && background !== 'none') {
    parts.push(
      indent + `<rect x="0" y="0" width="${formatNumber(width)}" height="${formatNumber(height)}" ` +
      `fill="${normalizeColor(background)}"/>`
    );
    parts.push(newline);
  }
  
  // Main content
  content.forEach((line) => {
    if (sanitize) {
      // Basic sanitization - remove script tags and event handlers
      if (line.includes('<script') || line.includes('javascript:') || line.match(/on\w+=/i)) {
        console.warn('[SVG Export] Blocked potentially malicious content');
        return;
      }
    }
    parts.push(indent + line);
    parts.push(newline);
  });
  
  // Close SVG
  parts.push('</svg>');
  
  return parts.join('');
}

/**
 * Optimizes an SVG string by removing unnecessary whitespace and attributes
 */
export function optimizeSVG(svg: string): string {
  return svg
    // Remove unnecessary spaces
    .replace(/\s+/g, ' ')
    // Remove spaces around = in attributes
    .replace(/\s*=\s*/g, '=')
    // Remove spaces before closing tags
    .replace(/\s*\/>/g, '/>')
    // Remove spaces after opening tags
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Downloads an SVG string as a file
 */
export function downloadSVG(svg: string, filename: string = 'figure.svg'): void {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

