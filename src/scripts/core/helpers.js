import { NAVIGATION_KEYS } from './constants';

export function isNavigationKeyPress(key) {
  return NAVIGATION_KEYS.has(key);
}

export function isTextEditKeyPress(key) {
  if (key === 'Backspace' || key.length === 1) {
    return true;
  }
  return false;
}
