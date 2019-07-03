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
const SUGGESTION_MAX = 5;
const navigationKeys = new Set([
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
    this.locationX = 0;
    this.locationY = 0;
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

  _resetSearchState() {
    this.listening = false;
    this.capturedChars = [];
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;
  }

  _enableListening() {
    this._resetSearchState();
    this.listening = true;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _disableListening() {
    this._resetSearchState();
    this.listening = false;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _captureCharacter(char) {
    if (this.listening) {
      this.capturedChars.push(char);

      if (this.capturedChars.length > CHAR_THRESHOLD) {
        this._populateSuggestions();
        this.currentChoiceIndex = 0;
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
        this.currentChoiceIndex = 0;
      }

      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  _highlightNextEmoji() {
    if (this.listening) {
      this.currentChoiceIndex = (this.currentChoiceIndex + 1) % SUGGESTION_MAX;
      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  _highlightPreviousEmoji() {
    if (this.listening) {
      this.currentChoiceIndex = (this.currentChoiceIndex + SUGGESTION_MAX - 1) % SUGGESTION_MAX;
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

  _handleNavInput(navInputKey) {
    if (navInputKey === 'Enter') {
      this._selectCurrentEmoji();
    } else if (navInputKey === 'Tab') {
      this._highlightNextEmoji();
    } else if (navInputKey === 'ArrowDown') {
      this._highlightNextEmoji();
    } else if (navInputKey === 'ArrowUp') {
      this._highlightPreviousEmoji();
    } else if (navInputKey === 'ArrowLeft') {
      // TODO: Use this if we want the emoji picker to be more "grid" like
    } else if (navInputKey === 'ArrowRight') {
      // TODO: Use this if we want the emoji picker to be more "grid" like
    }
  }

  _handleCharacterInput(charInputKey) {
    if (charInputKey === 'Backspace') {
      this._removeLastCharacter();
    } else if (charInputKey === ':') {
      this._enableListening();
    } else if (this.listening && /[a-zA-Z_]/.test(charInputKey)) {
      this._captureCharacter(charInputKey);
    } else if (this.listening) {
      this._disableListening();
    }
  }

  handleLocationChanged(locationX, locationY) {
    this.locationX = locationX;
    this.locationY = locationY;
  }

  handleSuggestionPicked(suggestionId) {
    this.currentChoiceIndex = suggestionId;
    this._selectCurrentEmoji();
  }

  handleEvent(keyboardEvent) {
    const key = keyboardEvent.key;
    const isValidKey = (
      !keyboardEvent.metaKey &&
      (key.length === 1 || navigationKeys.has(key)) || key === 'Backspace'
    );

    if (!isValidKey) {
      return;
    } else if (navigationKeys.has(key)) {
      if (this.listening) {
        this._handleNavInput(key);
        keyboardEvent.preventDefault();
      }
    } else {
      this._handleCharacterInput(key);
    }
  }

  clearSearch() {
    this._resetSearchState();
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

}

export const emojiPickerStore = new EmojiPickerStore();

const initialPickerHTML = `
  <div class="pickmoji-picker-banner">Select Emoji</div>
  <div class="pickmoji-picker-suggestions"></div>
`;

class EmojiPicker {
  constructor() {
    this.pickerElement = this._initPickerElement();

    emojiPickerStore.on(PickerEvents.pickerStateUpdated, this.onStateUpdate.bind(this));
  }

  _initSuggestionElement(indexId) {
    if (this.pickerElement) {
      return;
    }

    const suggestionElement = document.createElement('div');

    suggestionElement.id = `pickmoji-suggestion-${indexId}`;
    suggestionElement.className = 'pickmoji-suggestion-active';
    suggestionElement.addEventListener('mousedown', (mouseEvent) => {
      console.debug(`clicking suggestion ${suggestionElement.id}`);
      emojiPickerStore.handleSuggestionPicked(indexId);
      mouseEvent.preventDefault();
    });

    return suggestionElement;
  }

  _initPickerElement() {
    if (this.pickerElement) {
      return;
    }

    const pickerElement = document.createElement('div');

    pickerElement.id = 'pickmoji-picker';
    pickerElement.className = 'pickmoji-picker-hidden';
    pickerElement.innerHTML = initialPickerHTML;

    document.getElementsByTagName('body')[0].appendChild(pickerElement);

    const suggestionsWrapper = pickerElement.lastElementChild;

    for (let i = 0; i < SUGGESTION_MAX; i++) {
      suggestionsWrapper.appendChild(this._initSuggestionElement(i));
    }

    return pickerElement;
  }

  _displaySuggestions(pickerState) {
    const suggestionsWrapper = this.pickerElement.lastElementChild;
    const suggestionElements = suggestionsWrapper.children;

    for (let i = 0; i < SUGGESTION_MAX; i++) {
      const suggestedEmoji = pickerState.suggestedEmojis[i];
      const suggestionElement = suggestionElements[i];
      if (suggestedEmoji) {
        if (pickerState.currentChoiceIndex === i) {
          suggestionElement.className = 'pickmoji-suggestion-highlight';
        } else {
          suggestionElement.className = 'pickmoji-suggestion-active';
        }
        suggestionElement.innerText = `${suggestedEmoji.char} ${suggestedEmoji.name}`;
      } else {
        suggestionElement.className = 'pickmoji-suggestion-hidden';
      }
    }

    this._show(pickerState.locationX, pickerState.locationY);
  }

  _hide() {
    this.pickerElement.className = 'pickmoji-picker-hidden';
  }

  _show(locationX, locationY) {
    this.pickerElement.style = `left:${locationX}px;top:${locationY}px`;
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

    inputElement.addEventListener("keydown", (keyboardEvent) => {
      emojiPickerStore.handleEvent(keyboardEvent);
    });

    inputElement.addEventListener("blur", () => {
      if (emojiPickerStore.listening) {
        emojiPickerStore.clearSearch();
      }
    });

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
      textInputRegistry[inputElement.id] = new EmojiTextInput(inputElement);
      console.debug(`Registering element with id ${inputElement.id}`);
    }

    emojiPickerStore.clearSearch();
    emojiPickerStore.handleLocationChanged(
      inputElement.offsetLeft,
      inputElement.offsetTop + inputElement.offsetHeight + 5,
    );
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
