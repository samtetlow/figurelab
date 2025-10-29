// utils/wcagUtils.ts - WCAG Accessibility and Contrast Ratio Checks

import { hexToRgb, RGB } from './colorUtils';

export type WCAGLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large'; // Large is 18pt+ or 14pt+ bold

export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  level: 'AAA' | 'AA' | 'Fail';
  recommendation?: string;
}

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(rgb: RGB): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG requirements
 */
export function checkContrast(
  foreground: string,
  background: string,
  textSize: TextSize = 'normal'
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  // WCAG 2.1 Requirements:
  // Normal text: AA = 4.5:1, AAA = 7:1
  // Large text: AA = 3:1, AAA = 4.5:1
  const aaThreshold = textSize === 'large' ? 3 : 4.5;
  const aaaThreshold = textSize === 'large' ? 4.5 : 7;

  const passesAA = ratio >= aaThreshold;
  const passesAAA = ratio >= aaaThreshold;

  let level: 'AAA' | 'AA' | 'Fail';
  let recommendation: string | undefined;

  if (passesAAA) {
    level = 'AAA';
  } else if (passesAA) {
    level = 'AA';
    recommendation = `Good contrast (AA), but consider improving to ${aaaThreshold.toFixed(1)}:1 for AAA compliance.`;
  } else {
    level = 'Fail';
    recommendation = `Low contrast! Increase to at least ${aaThreshold.toFixed(1)}:1 for AA compliance.`;
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA,
    passesAAA,
    level,
    recommendation,
  };
}

/**
 * Suggest an accessible alternative color
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  targetLevel: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): string {
  const targetRatio = targetLevel === 'AAA' 
    ? (textSize === 'large' ? 4.5 : 7) 
    : (textSize === 'large' ? 3 : 4.5);

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) return foreground;

  const bgLuminance = getRelativeLuminance(bgRgb);

  // Determine if we should lighten or darken
  const shouldLighten = bgLuminance < 0.5;

  // Binary search for the right color
  let low = 0;
  let high = 255;
  let bestColor = foreground;
  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations && Math.abs(high - low) > 1) {
    const mid = Math.floor((low + high) / 2);
    const testColor = shouldLighten
      ? `#${mid.toString(16).padStart(2, '0').repeat(3)}`
      : `#${(255 - mid).toString(16).padStart(2, '0').repeat(3)}`;

    const ratio = getContrastRatio(testColor, background);

    if (ratio >= targetRatio) {
      bestColor = testColor;
      if (shouldLighten) {
        high = mid;
      } else {
        low = mid;
      }
    } else {
      if (shouldLighten) {
        low = mid;
      } else {
        high = mid;
      }
    }

    iterations++;
  }

  return bestColor;
}

/**
 * Check if a color is "light" (luminance > 0.5)
 */
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  return getRelativeLuminance(rgb) > 0.5;
}

/**
 * Get recommended text color (black or white) for a background
 */
export function getRecommendedTextColor(backgroundColor: string): '#000000' | '#ffffff' {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Batch check multiple color combinations
 */
export interface ColorPair {
  foreground: string;
  background: string;
  label?: string;
}

export interface BatchContrastResult extends ContrastResult {
  pair: ColorPair;
}

export function batchCheckContrast(pairs: ColorPair[], textSize: TextSize = 'normal'): BatchContrastResult[] {
  return pairs.map((pair) => ({
    pair,
    ...checkContrast(pair.foreground, pair.background, textSize),
  }));
}

/**
 * Generate a WCAG compliance report
 */
export function generateComplianceReport(pairs: ColorPair[], textSize: TextSize = 'normal'): string {
  const results = batchCheckContrast(pairs, textSize);
  
  const lines: string[] = [];
  lines.push('=== WCAG Contrast Compliance Report ===\n');
  lines.push(`Text Size: ${textSize === 'large' ? 'Large (18pt+ or 14pt+ bold)' : 'Normal'}\n`);
  lines.push('Required Ratios: AA = ' + (textSize === 'large' ? '3:1' : '4.5:1') + ', AAA = ' + (textSize === 'large' ? '4.5:1' : '7:1') + '\n\n');

  results.forEach((result, idx) => {
    const { pair, ratio, level, recommendation } = result;
    lines.push(`${idx + 1}. ${pair.label || `Pair ${idx + 1}`}`);
    lines.push(`   Foreground: ${pair.foreground}`);
    lines.push(`   Background: ${pair.background}`);
    lines.push(`   Ratio: ${ratio}:1`);
    lines.push(`   Level: ${level}`);
    if (recommendation) {
      lines.push(`   → ${recommendation}`);
    }
    lines.push('');
  });

  const passing = results.filter(r => r.passesAA).length;
  const total = results.length;
  lines.push(`Summary: ${passing}/${total} pairs pass AA compliance (${Math.round((passing / total) * 100)}%)`);

  return lines.join('\n');
}

