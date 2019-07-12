import { INPUT_NAVIGATION_KEYS, PICKER_NAVIGATION_KEYS } from './constants';

export function isPickerNavigationKeyPress(key) {
  return PICKER_NAVIGATION_KEYS.has(key);
}

export function isInputNavigationKeyPress(key) {
  return INPUT_NAVIGATION_KEYS.has(key);
}

export function isTextEditKeyPress(key) {
  if (key === 'Backspace' || key.length === 1) {
    return true;
  }
  return false;
}
