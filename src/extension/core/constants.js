export const CHAR_THRESHOLD = 1;
export const SUGGESTION_MAX = 5;
export const PICKER_NAVIGATION_KEYS = new Set([
  'Enter',
  'Tab',
  'ArrowDown',
  'ArrowUp',
]);

export const INPUT_NAVIGATION_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
]);

export const PickerEvents = {
  pickerStateUpdated: 'pickerStateUpdated',
  suggestionClicked: 'suggestionClicked',
  emojiPicked: 'emojiPicked',
};

export const InputEvents = {
  keyDown: 'keyDown',
  searchTermChanged: 'searchTermChanged',
  inputFocused: 'inputFocused',
  inputBlur: 'inputBlur',
};
