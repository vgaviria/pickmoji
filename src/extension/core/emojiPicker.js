import { emojiPickerStore } from './emojiPickerStore';

import { SUGGESTION_MAX, PickerEvents } from './constants';

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

    this._show();
    this._setPosition(pickerState);
  }

  _setPosition(pickerState) {
    const { inputState } = pickerState;
    let locationX, locationY;

    if (pickerState.reverseDisplay) {
      locationX = Math.round(inputState.location.x);
      locationY = Math.round(inputState.location.y - this.pickerElement.offsetHeight - 5);
    } else {
      locationX = Math.round(inputState.location.x);
      locationY = Math.round(inputState.location.y + inputState.height + 5);
    }

    this.pickerElement.style = `left:${locationX}px;top:${locationY}px`;
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

export const emojiPicker = new EmojiPicker();
