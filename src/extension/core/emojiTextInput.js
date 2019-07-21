import { emojiPickerStore } from './emojiPickerStore';

import { PickerEvents } from './constants';
import { isInputNavigationKeyPress, isTextEditKeyPress } from './helpers';

// TODO: This is assuming that the input element is an <input type='textbox'>
export class EmojiTextInput {
  constructor(inputElement) {
    this._inputElement = inputElement;
    this.currentWordStart = 0;
    this.currentWordEnd = 0;
    this.currentWord = '';

    this._inputElement.addEventListener("keydown", (keyboardEvent) => {
      emojiPickerStore.handleEvent(keyboardEvent);
    });

    this._inputElement.addEventListener("keyup", (keyboardEvent) => {
      const changeCurrentWord = (
        !this.currentWord ||
        isTextEditKeyPress(keyboardEvent.key) ||
        isInputNavigationKeyPress(keyboardEvent.key) &&
        !this._isCusorWithinWordBounds()
      );
      if (changeCurrentWord) {
        this._setCurrentWord();
      }
    });

    this._inputElement.addEventListener("click", () => {
      const changeCurrentWord = !this.currentWord || !this._isCusorWithinWordBounds();
      if (changeCurrentWord) {
        this._setCurrentWord();
      }
    });

    this._inputElement.addEventListener("blur", () => {
      emojiPickerStore.clearSearch();
    });

    emojiPickerStore.on(
      PickerEvents.emojiPicked, this.onEmojiPicked.bind(this), this._inputElement.id
    );
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

  _getWordCursorLocation() {
    return this._inputElement.selectionEnd - this.currentWordStart;
  }

  _isCusorWithinWordBounds() {
    const cursorLocation = this._getCursorLocation();
    return cursorLocation >= this.currentWordStart && cursorLocation <= this.currentWordEnd
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

      emojiPickerStore.handleInputWordChanged(this.currentWord, this._getWordCursorLocation());
    }
  }

  _replaceTextWithEmoji(emojiChar) {
    const oldText = this._getInputValue();
    const searchTextEndIndex = this._getCursorLocation();
    const searchTextStartIndex = oldText.lastIndexOf(':', this._getCursorLocation());
    this._setInputValue(
      oldText.substr(0, searchTextStartIndex) + emojiChar + oldText.substr(searchTextEndIndex, oldText.length)
    );
    this._setCursorLocation(searchTextStartIndex + 1);
  }

  focus() {
    const inputBoundingRect = this._inputElement.getBoundingClientRect();
    const inputFocusedEvent = {
      input: {
        location: {
          x: inputBoundingRect.x + window.scrollX,
          y: inputBoundingRect.y + window.scrollY,
        },
        width: inputBoundingRect.width,
        height: inputBoundingRect.height,
      },
      viewport: {
        location: {
          x: window.scrollX,
          y: window.scrollY,
        },
        width: window.innerWidth,
        height: window.innerHeight,
      }
    };

    emojiPickerStore.handleInputFocused(inputFocusedEvent);
  }

  onEmojiPicked(emoji) {
    console.debug(emoji);
    this._replaceTextWithEmoji(emoji.char);
    this._setCurrentWord();
  }
}

