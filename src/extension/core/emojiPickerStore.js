import { WeightedFuzzySearcher } from './fuzzySearch';

import { CHAR_THRESHOLD, SUGGESTION_MAX, PickerEvents } from './constants';
import { isInputNavigationKeyPress, isPickerNavigationKeyPress } from './helpers';
import emojis from '../data/emojis.json';
import {EventEmitter} from './eventEmitter';

class EmojiPickerStore extends EventEmitter {
  constructor() {
    super();
    this.inputState = {};
    this.handlerChannelId = null;
    this.reverseDisplay = false;

    this.listening = false;
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;

    this.fuzzySearcher = new WeightedFuzzySearcher(emojis, {
      itemId: 'name',
      numResults: 5,
    });
  }

  _populateSuggestions(searchTerm) {
    let newSuggestions;
    const _perfTimeStart = performance.now();

    // TODO: probably want to keep the array around and not allocate new ones
    // every time we populate the suggestions.
    if (searchTerm.length > CHAR_THRESHOLD) {
      newSuggestions = this.fuzzySearcher.search(searchTerm);
    } else {
      newSuggestions = []
    }

    const _perfTimeEnd = performance.now();

    console.debug(`
      ${newSuggestions.length} suggestion results found for search
      term "${searchTerm}" in ${_perfTimeEnd - _perfTimeStart}ms
    `);

    this.suggestedEmojis = newSuggestions;
  }

  _resetSearchState() {
    this.listening = false;
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;
  }

  _enableListening() {
    if (!this.listening) {
      this._resetSearchState();
      this.listening = true;
      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  _disableListening() {
    if (this.listening) {
      this._resetSearchState();
      this.listening = false;
      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  _highlightNextEmoji() {
    this.currentChoiceIndex = (this.currentChoiceIndex + 1) % SUGGESTION_MAX;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _highlightPreviousEmoji() {
    this.currentChoiceIndex = (this.currentChoiceIndex + SUGGESTION_MAX - 1) % SUGGESTION_MAX;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _selectCurrentEmoji() {
    const emoji = this.suggestedEmojis[this.currentChoiceIndex];
    this._disableListening();
    this.emit(PickerEvents.emojiPicked, emoji, this.handlerChannelId);
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
      this._disableListening();
    } else if (navInputKey === 'ArrowRight') {
      this._disableListening();
    }
  }

  handleInputFocused(inputFocusedEvent) {
    const { input, viewport } = inputFocusedEvent;
    const reverseDisplayThreshold = viewport.location.y + (viewport.height * .60)

    this.reverseDisplay = input.location.y > reverseDisplayThreshold
    this.inputState = input;
    this.handlerChannelId = input.id;

    this.clearSearch();
  }

  handleSuggestionPicked(suggestionId) {
    this.currentChoiceIndex = suggestionId;
    this._selectCurrentEmoji();
  }

  handleInputWordChanged(word, wordCursorLocation) {
    const colonLocation = word.lastIndexOf(':');

    if (word && colonLocation >= 0) {
      const searchTerm = word.substr(colonLocation + 1, wordCursorLocation - colonLocation - 1);
      this._enableListening();
      this._populateSuggestions(searchTerm);
    }

    if (this.suggestedEmojis.length <= 0) {
      this._disableListening();
    }

    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  handleEvent(keyboardEvent) {
    const key = keyboardEvent.key;
    if (!this.listening) {
      return;
    } else if (key === "Escape") {
      this._disableListening();
    } else if (isPickerNavigationKeyPress(key)) {
      keyboardEvent.preventDefault();
      this._handleNavInput(key);
    } else if (isInputNavigationKeyPress(key)) {
      this._disableListening();
    }
  }

  clearSearch() {
    this._disableListening();
  }

}

export const emojiPickerStore = new EmojiPickerStore();
