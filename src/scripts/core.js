import 'textarea-caret';
import fuzzysearch from 'fuzzysearch';
import { emojiNames, emojiIndex } from './emojis';

class EventEmitter {
  constructor() {
    this.eventHandlers = {};
  }

  on(eventName, callback) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].push(callback);
    } else {
      this.eventHandlers[eventName] = [callback];
    }
  }

  emit(eventName, state) {
    const callbacks = this.eventHandlers[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(state);
      });
    }
  }
}

const CHAR_THRESHOLD = 1;
const SUGGESTION_MAX = 20;
const navigationKeys = new Set([
  'Backspace',
  'Enter',
  'Tab',
  'ArrowDown',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
]);


class EmojiPickerStore extends EventEmitter {
  constructor() {
    super();
    this.listening = false;
    this.capturedChars = [];
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;
  }

  _populateSuggestions() {
    // TODO: probably want to keep the array around and not allocate new ones
    // every time we populate the suggestions.
    const newSuggestions = [];
    const capturedText = this.capturedChars.join('');

    for (const name of emojiNames) {
      if (fuzzysearch(capturedText, name)){
        newSuggestions.push(emojiIndex[name]);
      }
      if (newSuggestions.length >= SUGGESTION_MAX) {
        break;
      }
    }

    this.suggestedEmojis = newSuggestions;
  }

  resetState() {
    this.listening = false;
    this.capturedChars = [];
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;
  }

  _enableListening() {
    this.resetState();
    this.listening = true;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _disableListening() {
    this.resetState();
    this.listening = false;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _captureCharacter(char) {
    if (this.listening) {
      this.capturedChars.push(char);

      if (this.capturedChars.length > CHAR_THRESHOLD) {
        this._populateSuggestions();
      }

      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  _removeLastCharacter() {
    if (this.listening) {
      if (this.capturedChars.length <= 0) {
        this._disableListening();
      }

      this.capturedChars.pop();

      if (this.capturedChars.length > CHAR_THRESHOLD) {
        this._populateSuggestions();
      }

      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  _selectCurrentEmoji() {
    const emoji = this.suggestedEmojis[this.currentChoiceIndex];
    if (this.listening && emoji) {
      this._disableListening();
      this.emit(PickerEvents.emojiPicked, emoji);
    }
  }

  _handleNavInput(key) {
    if (key === 'Backspace') {
      this._removeLastCharacter();
    } else if (key === 'Enter') {
      this._selectCurrentEmoji();
    }
  }

  _handleCharacterInput(char) {
    if (char === ':') {
      this._enableListening();
    } else if (this.listening && /[a-zA-Z_]/.test(char)) {
      this._captureCharacter(char);
    } else if (this.listening) {
      this._disableListening();
    }
  }

  handleEvent(keyboardEvent) {
    const key = keyboardEvent.key;

    if (keyboardEvent.metaKey || (key.length !== 1 && !navigationKeys.has(key))) {
      return;
    } else if (navigationKeys.has(key)) {
      this._handleNavInput(key);
    } else {
      this._handleCharacterInput(key);
    }
  }
}

export const emojiPickerStore = new EmojiPickerStore();

class EmojiPicker {
  constructor() {
    this.pickerElement = this._initPickerElement();

    emojiPickerStore.on(PickerEvents.pickerStateUpdated, this.onStateUpdate.bind(this));
  }

  _initPickerElement() {
    const pickerElement = document.createElement('div');
    pickerElement.className = 'pickmoji-picker-active';

    for (let i = 0; i < SUGGESTION_MAX; i++) {
      const suggestionElement = pickerElement.appendChild(document.createElement('div'));
      suggestionElement.className = 'pickmoji-suggestion-active';
    }

    document.getElementsByTagName('body')[0].appendChild(pickerElement);

    return pickerElement;
  }

  _displaySuggestions(pickerState) {
    const suggestionElements = this.pickerElement.children;

    for (let i = 0; i < SUGGESTION_MAX; i++) {
      const suggestedEmoji = pickerState.suggestedEmojis[i];
      const suggestionElement = suggestionElements[i];
      if (suggestedEmoji) {
        suggestionElement.className = 'pickmoji-suggestion-active';
        suggestionElement.innerText = `${suggestedEmoji.char} ${suggestedEmoji.name}`;
      } else {
        suggestionElement.className = 'pickmoji-suggestion-hidden';
      }
    }

    this._show();
  }

  _hide() {
    this.pickerElement.className = 'pickmoji-picker-hidden';
  }

  _show() {
    this.pickerElement.className = 'pickmoji-picker-active';
  }

  onStateUpdate(pickerState) {
    if (pickerState.suggestedEmojis.length > 0) {
      this._displaySuggestions(pickerState);
    } else {
      this._hide();
    }
  }

}

class EmojiTextInput {
  constructor(inputElement) {
    this.inputElement = inputElement;

    emojiPickerStore.on(PickerEvents.emojiPicked, this.onEmojiPicked.bind(this));
  }

  _replaceTextWithEmoji(emojiChar) {
    // TODO: This is assuming that the input element is an <input type='textbox'>
    const oldText = this.inputElement.value;
    const searchTextEndIndex = this.inputElement.selectionEnd;
    const searchTextStartIndex = this.inputElement.value.lastIndexOf(':', this.inputElement.selectionEnd);
    this.inputElement.value = oldText.substr(0, searchTextStartIndex) + emojiChar + oldText.substr(searchTextEndIndex, oldText.length);
    this.inputElement.selectionEnd = searchTextStartIndex + 1;
  }

  onEmojiPicked(emoji) {
    console.debug(emoji);
    this._replaceTextWithEmoji(emoji.char);
  }
}

const textInputRegistry = {};

function isTextInputElement (htmlNode) {
  if (htmlNode.tagName.toLowerCase() === 'input' && htmlNode.attributes.getNamedItem('type').value === 'textbox') {
    return true;
  }
  return false;
}

document.addEventListener("focusin", () => {
  if (isTextInputElement(document.activeElement)) {
    const inputElement = document.activeElement;

    if (!inputElement.id || !textInputRegistry[inputElement.id]) {
      inputElement.id = inputElement.id || `pickmoji-text-input-${Math.round(Math.random() * 1000000000)}`;
      inputElement.addEventListener("keydown", (keyboardEvent) => {
        emojiPickerStore.handleEvent(keyboardEvent);
      });
      textInputRegistry[inputElement.id] = new EmojiTextInput(inputElement);
      console.debug(`Registering element with id ${inputElement.id}`);
    }

    emojiPickerStore.resetState();
  }
});

export const PickerEvents = {
  pickerStateUpdated: 'pickerStateUpdated',
  emojiPicked: 'emojiPicked',
};
export const emojiPicker = new EmojiPicker();

// export default {
//   emojiPicker: emojiPicker,
//   PickerEvents: PickerEvents,
// };
