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

function isNavigationKeyPress(key) {
  return navigationKeys.has(key);
}

function isTextEditKeyPress(key) {
  if (key === 'Backspace' || key.length === 1) {
    return true;
  }
  return false;
}


class EmojiPickerStore extends EventEmitter {
  constructor() {
    super();
    this.locationX = 0;
    this.locationY = 0;
    this.listening = false;
    this.disableWordCompletion = false;
    this.searchTerm = '';
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;
  }

  _populateSuggestions() {
    // TODO: probably want to keep the array around and not allocate new ones
    // every time we populate the suggestions.
    const newSuggestions = [];

    for (const name of emojiNames) {
      if (fuzzysearch(this.searchTerm, name)){
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
    this.disableWordCompletion = false;
    this.searchTerm = '';
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

  handleLocationChanged(locationX, locationY) {
    this.locationX = locationX;
    this.locationY = locationY;
  }

  handleSuggestionPicked(suggestionId) {
    this.currentChoiceIndex = suggestionId;
    this._selectCurrentEmoji();
  }

  handleInputWordChanged(word) {
    const colonLocation = word.lastIndexOf(':');
    if (word && colonLocation >= 0) {
      if (!this.listening) {
        this._enableListening();
      }

      this.searchTerm = word.substr(colonLocation + 1);

      if (this.searchTerm.length > CHAR_THRESHOLD) {
        this._populateSuggestions();
      }

      this.emit(PickerEvents.pickerStateUpdated, this);
    } else if(this.listening) {
      this._disableListening();
    }
  }

  handleEvent(keyboardEvent) {
    const key = keyboardEvent.key;
    if (key === "Escape") {
      this._disableListening();
      this.disableWordCompletion = true;
    } else if (this.listening && isNavigationKeyPress(key)) {
      this._handleNavInput(key);
      keyboardEvent.preventDefault();
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

// TODO: This is assuming that the input element is an <input type='textbox'>
class EmojiTextInput {
  constructor(inputElement) {
    this._inputElement = inputElement;
    this.currentWordStart = 0;
    this.currentWordEnd = 0;
    this.currentWord = '';

    this._inputElement.addEventListener("keydown", (keyboardEvent) => {
      emojiPickerStore.handleEvent(keyboardEvent);
    });

    this._inputElement.addEventListener("keyup", (keyboardEvent) => {
      const cursorLocation = this._getCursorLocation();
      const changeCurrentWord = (
        !this.currentWord ||
        isTextEditKeyPress(keyboardEvent.key) ||
        isNavigationKeyPress(keyboardEvent.key) &&
        (cursorLocation < this.currentWordStart || cursorLocation > this.currentWordEnd)
      );
      if (changeCurrentWord) {
        this._setCurrentWord();
      }
    });

    this._inputElement.addEventListener("click", () => {
      const cursorLocation = this._getCursorLocation();
      const changeCurrentWord = (
        !this.currentWord ||
        (cursorLocation >= this.currentWordStart || cursorLocation <= this.currentWordEnd)
      );
      if (changeCurrentWord) {
        this._setCurrentWord();
      }
    });

    this._inputElement.addEventListener("blur", () => {
      if (emojiPickerStore.listening) {
        emojiPickerStore.clearSearch();
      }
    });

    emojiPickerStore.on(PickerEvents.emojiPicked, this.onEmojiPicked.bind(this));
  }

  _getInputValue() {
    return this._inputElement.value;
  }

  _setInputValue(value) {
    this._inputElement.value = value;
  }

  _getCursorLocation() {
    return this._inputElement.selectionEnd;
  }

  _setCursorLocation(cursorLocation) {
    this._inputElement.selectionEnd = cursorLocation;
  }

  _setCurrentWord() {
    const text = this._getInputValue();
    const cursorLocation = this._getCursorLocation() - 1;
    if (text[cursorLocation] !== ' ') {
      const firstIndex = text.lastIndexOf(' ', cursorLocation);
      const lastIndex = text.indexOf(' ', cursorLocation)

      this.currentWordStart = (firstIndex < 0 ? 0 : firstIndex + 1);
      this.currentWordEnd = (lastIndex < 0 ? text.length : lastIndex);
      this.currentWord = text.substr(
        this.currentWordStart, this.currentWordEnd - this.currentWordStart
      );

      console.debug(
        `Current word "${this.currentWord}" at location ${this.currentWordStart},${this.currentWordEnd}`
      );

      emojiPickerStore.handleInputWordChanged(this.currentWord);
    }
  }

  _replaceTextWithEmoji(emojiChar) {
    const oldText = this._getInputValue();
    const searchTextEndIndex = this.currentWordEnd;
    const searchTextStartIndex = oldText.lastIndexOf(':', this._getCursorLocation());
    this._setInputValue(
      oldText.substr(0, searchTextStartIndex) + emojiChar + oldText.substr(searchTextEndIndex, oldText.length)
    );
    this._setCursorLocation(searchTextStartIndex + 1);
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
