// utils/colorUtils.ts - Comprehensive color conversion and manipulation

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface CMYK {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

// =======================
// HEX <-> RGB
// =======================

export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// =======================
// RGB <-> HSL
// =======================

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// =======================
// RGB <-> CMYK
// =======================

export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  const k = Math.min(c, m, y);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  c = ((c - k) / (1 - k)) * 100;
  m = ((m - k) / (1 - k)) * 100;
  y = ((y - k) / (1 - k)) * 100;

  return {
    c: Math.round(c),
    m: Math.round(m),
    y: Math.round(y),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  c /= 100;
  m /= 100;
  y /= 100;
  k /= 100;

  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  };
}

// =======================
// RGB <-> HSV
// =======================

export function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function hsvToRgb(h: number, s: number, v: number): RGB {
  h /= 360;
  s /= 100;
  v /= 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r, g, b;

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
    default:
      (r = 0), (g = 0), (b = 0);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// =======================
// Universal Conversion
// =======================

export function convertColor(from: 'hex' | 'rgb' | 'hsl' | 'cmyk', to: 'hex' | 'rgb' | 'hsl' | 'cmyk', value: any): any {
  // Convert input to RGB first
  let rgb: RGB;

  switch (from) {
    case 'hex':
      rgb = hexToRgb(value) || { r: 0, g: 0, b: 0 };
      break;
    case 'rgb':
      rgb = value;
      break;
    case 'hsl':
      rgb = hslToRgb(value.h, value.s, value.l);
      break;
    case 'cmyk':
      rgb = cmykToRgb(value.c, value.m, value.y, value.k);
      break;
    default:
      rgb = { r: 0, g: 0, b: 0 };
  }

  // Convert RGB to output format
  switch (to) {
    case 'hex':
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    case 'rgb':
      return rgb;
    case 'hsl':
      return rgbToHsl(rgb.r, rgb.g, rgb.b);
    case 'cmyk':
      return rgbToCmyk(rgb.r, rgb.g, rgb.b);
    default:
      return rgb;
  }
}

// =======================
// Color Utilities
// =======================

export function lighten(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + amount);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

export function darken(color: string, amount: number): string {
  return lighten(color, -amount);
}

export function saturate(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.min(100, Math.max(0, hsl.s + amount));

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

export function desaturate(color: string, amount: number): string {
  return saturate(color, -amount);
}

export function invert(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

export function grayscale(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return rgbToHex(gray, gray, gray);
}

// CBG (Color Blind Gamut) intentionally omitted per requirements

// =======================
// Format Utilities
// =======================

export function rgbToString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function hslToString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

export function cmykToString(cmyk: CMYK): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

export function parseColorString(str: string): RGB | null {
  // Try hex
  if (str.startsWith('#')) {
    return hexToRgb(str);
  }

  // Try rgb/rgba
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Try hsl
  const hslMatch = str.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
  if (hslMatch) {
    return hslToRgb(
      parseInt(hslMatch[1], 10),
      parseInt(hslMatch[2], 10),
      parseInt(hslMatch[3], 10)
    );
  }

  return null;
}

