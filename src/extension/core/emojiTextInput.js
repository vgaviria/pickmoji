import { emojiPickerStore } from './emojiPickerStore';

import { PickerEvents } from './constants';
import { isInputNavigationKeyPress, isTextEditKeyPress } from './helpers';

// TODO: This is assuming that the input element is an <input type='textbox'>
export class TextInputElement {
  constructor(inputElement) {
    this._inputElement = inputElement;
    this._wordChangedHandler = () => {};
    this._currentWordStart = 0;
    this._currentWordEnd = 0;
    this._currentWord = '';

    this._inputElement.addEventListener("keyup", this._onKeyUp.bind(this));
    this._inputElement.addEventListener("click", this._onClick.bind(this));
  }

  onKeyDown(keyDownHandler) {
    this._inputElement.addEventListener("keydown", (keyboardEvent) => keyDownHandler(keyboardEvent));
  }

  onBlur(blurHandler) {
    this._inputElement.addEventListener("blur", blurHandler);
  }

  onWordChanged(callback) {
    this._wordChangedHandler = callback;
  }

  getId() {
    this._inputElement.id;
  }

  getBoundingRect() {
    const inputBoundingRect = this._inputElement.getBoundingClientRect();
    return {
      location: {
        x: inputBoundingRect.x + window.scrollX,
        y: inputBoundingRect.y + window.scrollY,
      },
      width: inputBoundingRect.width,
      height: inputBoundingRect.height,
    };
  }

  getInputValue() {
    return this._inputElement.value;
  }

  getCursorLocation() {
    return this._inputElement.selectionEnd;
  }

  replaceText(subStr, newValue, startingAt) {
    const oldText = this.getInputValue();
    const subStrStartIndex = oldText.indexOf(subStr, startingAt);

    if (subStrStartIndex < 0) {
      return
    }

    const subStrEndIndex = subStrStartIndex + subStr.length - 1

    this._setInputValue(
      oldText.substr(0, subStrStartIndex) + newValue + oldText.substr(subStrEndIndex + 1)
    );
    this._setCursorLocation(subStrStartIndex + 1);
  }

  _onClick() {
    const changeCurrentWord = !this._currentWord || !this._isCusorWithinWordBounds();
    if (changeCurrentWord) {
      this._setCurrentWord();
    }
  }

  _onKeyUp(keyboardEvent) {
    const changeCurrentWord = (
      !this._currentWord ||
      isTextEditKeyPress(keyboardEvent.key) ||
      isInputNavigationKeyPress(keyboardEvent.key) &&
      !this._isCusorWithinWordBounds()
    );
    if (changeCurrentWord) {
      this._setCurrentWord();
    }
  }

  _setInputValue(value) {
    this._inputElement.value = value;
  }

  _setCursorLocation(cursorLocation) {
    this._inputElement.selectionEnd = cursorLocation;
    this._setCurrentWord();
  }

  _getWordCursorLocation() {
    return this._inputElement.selectionEnd - this._currentWordStart;
  }

  _isCusorWithinWordBounds() {
    const cursorLocation = this.getCursorLocation();
    return cursorLocation >= this._currentWordStart && cursorLocation <= this._currentWordEnd
  }

  _setCurrentWord() {
    const text = this.getInputValue();
    const cursorLocation = this.getCursorLocation() - 1;
    if (text[cursorLocation] !== ' ') {
      const firstIndex = text.lastIndexOf(' ', cursorLocation);
      const lastIndex = text.indexOf(' ', cursorLocation)

      this._currentWordStart = (firstIndex < 0 ? 0 : firstIndex + 1);
      this._currentWordEnd = (lastIndex < 0 ? text.length : lastIndex);
      this._currentWord = text.substr(
        this._currentWordStart, this._currentWordEnd - this._currentWordStart
      );

      console.debug(
        `Current word "${this._currentWord}" at location ${this._currentWordStart},${this._currentWordEnd}`
      );

      this._wordChangedHandler(this._currentWord, this._getWordCursorLocation());
    }
  }
}

export class EmojiTextInput {
  constructor(inputElement) {
    this.textInput = new TextInputElement(inputElement);

    this.textInput.onKeyDown((keyboardEvent) => emojiPickerStore.handleEvent(keyboardEvent));
    this.textInput.onBlur(() => emojiPickerStore.clearSearch());
    this.textInput.onWordChanged((currentWord, currentIndex) => {
      emojiPickerStore.handleInputWordChanged(currentWord, currentIndex);
    });

    emojiPickerStore.on(
      PickerEvents.emojiPicked, this.onEmojiPicked.bind(this), this.textInput.getId()
    );

  }

  _replaceTextWithEmoji(emojiChar) {
    const oldText = this.textInput.getInputValue();
    const searchTextEndIndex = this.textInput.getCursorLocation();
    const searchTextStartIndex = oldText.lastIndexOf(':', searchTextEndIndex);
    const searchText = oldText.substring(searchTextStartIndex, searchTextEndIndex);
    this.textInput.replaceText(searchText, emojiChar, searchTextStartIndex);
  }

  focus() {
    const inputFocusedEvent = {
      input: this.textInput.getBoundingRect(),
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
    this._replaceTextWithEmoji(emoji.char);
  }
}

