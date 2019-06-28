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

class EmojiPickerStore extends EventEmitter {
  constructor() {
    super();
    this.listening = false;
    this.capturedChars = [];
    this.suggestedEmojis = [];
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

  enableListening() {
    this.listening = true;
    this.capturedChars = [];
    this.suggestedEmojis = [];
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  disableListening() {
    this.listening = false;
    this.capturedChars = [];
    this.suggestedEmojis = [];
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  captureCharacter(char) {
    if (this.listening) {
      this.capturedChars.push(char);

      if (this.capturedChars.length > CHAR_THRESHOLD) {
        this._populateSuggestions();
      }

      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  removeLastCharacter() {
    if (this.isListening) {
      if (this.capturedChars.length <= 0) {
        this.disableListening();
      }

      this.capturedChars.pop();

      if (this.capturedChars.length > CHAR_THRESHOLD) {
        this._populateSuggestions();
      }

      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  isListening() {
    return this.listening;
  }
}

export const emojiPickerStore = new EmojiPickerStore();

// TODO: We're testing directly on the document for the time being. I imagine
// that we need to attach a listener to the active element in the future.
document.addEventListener("keydown", (keyboardEvent) => {
  const key = keyboardEvent.key;

  if (keyboardEvent.metaKey || (key.length !== 1 && key != 'Backspace')) {
    return;
  }

  if (keyboardEvent.key === 'Backspace') {
    emojiPickerStore.removeLastCharacter();
  } else if (key === ':') {
    emojiPickerStore.enableListening();
  } else if (emojiPickerStore.isListening() && /[a-zA-Z_]/.test(key)) {
    emojiPickerStore.captureCharacter(key);
  } else if (emojiPickerStore.isListening) {
    emojiPickerStore.disableListening();
  }

});

class EmojiPicker {
  constructor() {
    this.pickerElement = this.initPickerElement();

    emojiPickerStore.on(PickerEvents.pickerStateUpdated, this.update.bind(this));
  }

  initPickerElement() {
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

  update(pickerState) {
    if (pickerState.suggestedEmojis.length > 0) {
      this._displaySuggestions(pickerState);
    } else {
      this._hide();
    }
  }

}

export const PickerEvents = {
  pickerStateUpdated: 'pickerStateUpdated'
};
export const emojiPicker = new EmojiPicker();

// export default {
//   emojiPicker: emojiPicker,
//   PickerEvents: PickerEvents,
// };
