/**
 * HUD Theming System
 *
 * Applies civilization-specific colors and patterns to the game HUD.
 * Updates CSS custom properties to theme panels, borders, and accents.
 */

import type { CivilizationAesthetics } from '../types';

/**
 * Apply civilization theme to the HUD
 *
 * Sets CSS custom properties on :root to enable dynamic theming
 * based on the player's chosen civilization.
 *
 * @param aesthetics - Civilization aesthetic data (colors, patterns, architecture)
 */
export function applyCivilizationTheme(aesthetics: CivilizationAesthetics): void {
  const root = document.documentElement;

  // Apply core civilization colors as CSS custom properties
  root.style.setProperty('--civ-primary', aesthetics.primaryColor);
  root.style.setProperty('--civ-secondary', aesthetics.secondaryColor);
  root.style.setProperty('--civ-accent', aesthetics.accentColor);

  // Apply pattern attribute for CSS pattern matching
  document.body.setAttribute('data-civ-pattern', aesthetics.pattern);
  document.body.setAttribute('data-civ-architecture', aesthetics.architecture);

  console.log(`Applied ${aesthetics.pattern} theme with colors:`, {
    primary: aesthetics.primaryColor,
    secondary: aesthetics.secondaryColor,
    accent: aesthetics.accentColor,
  });
}

/**
 * Remove civilization theme and restore defaults
 *
 * Useful for testing or when switching civilizations.
 */
export function removeCivilizationTheme(): void {
  const root = document.documentElement;

  root.style.removeProperty('--civ-primary');
  root.style.removeProperty('--civ-secondary');
  root.style.removeProperty('--civ-accent');

  document.body.removeAttribute('data-civ-pattern');
  document.body.removeAttribute('data-civ-architecture');

  console.log('Removed civilization theme');
}

/**
 * Get current civilization theme colors
 *
 * @returns Object with current theme colors or null if no theme applied
 */
export function getCurrentTheme(): { primary: string; secondary: string; accent: string } | null {
  const root = document.documentElement;
  const style = getComputedStyle(root);

  const primary = style.getPropertyValue('--civ-primary').trim();
  const secondary = style.getPropertyValue('--civ-secondary').trim();
  const accent = style.getPropertyValue('--civ-accent').trim();

  if (!primary || !secondary || !accent) {
    return null;
  }

  return { primary, secondary, accent };
}
