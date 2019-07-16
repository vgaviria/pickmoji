import { WeightedFuzzySearcher } from './fuzzySearch';

import { CHAR_THRESHOLD, SUGGESTION_MAX, PickerEvents } from './constants';
import { isInputNavigationKeyPress, isPickerNavigationKeyPress } from './helpers';
import emojis from '../data/emojis.json';
import {EventEmitter} from './eventEmitter';

class EmojiPickerStore extends EventEmitter {
  constructor() {
    super();
    this.inputState = {};
    this.viewportState = {};
    this.reverseDisplay = false;

    this.listening = false;
    this.disableWordCompletion = false;
    this.searchTerm = '';
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;

    this.fuzzySearcher = new WeightedFuzzySearcher(emojis, {
      itemId: 'name',
      numResults: 5,
    });
  }

  _populateSuggestions() {
    const _perfTimeStart = performance.now();

    // TODO: probably want to keep the array around and not allocate new ones
    // every time we populate the suggestions.
    const newSuggestions = this.fuzzySearcher.search(this.searchTerm);

    const _perfTimeEnd = performance.now();

    console.debug(`
      ${newSuggestions.length} suggestion results found for search
      term "${this.searchTerm}" in ${_perfTimeEnd - _perfTimeStart}ms
    `);

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
    } else if (this.listening && navInputKey === 'ArrowLeft') {
      this._disableListening();
    } else if (this.listening && navInputKey === 'ArrowRight') {
      this._disableListening();
    }
  }

  handleInputFocused(inputFocusedEvent) {
    const { input, viewport } = inputFocusedEvent;
    const reverseDisplayThreshold = viewport.location.y + (viewport.height * .60)

    this.reverseDisplay = input.location.y > reverseDisplayThreshold
    this.inputState = input;
    this.viewportState = viewport;

    emojiPickerStore.clearSearch();

    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  handleSuggestionPicked(suggestionId) {
    this.currentChoiceIndex = suggestionId;
    this._selectCurrentEmoji();
  }

  handleInputWordChanged(word, wordCursorLocation) {
    const colonLocation = word.lastIndexOf(':');
    if (word && colonLocation >= 0) {
      if (!this.listening) {
        this._enableListening();
      }

      this.searchTerm = word.substr(colonLocation + 1, wordCursorLocation - colonLocation - 1);

      if (this.searchTerm.length > CHAR_THRESHOLD) {
        this._populateSuggestions();
        if (this.suggestedEmojis.length === 0) {
          this._disableListening();
        }
      } else if(this.listening) {
        this._disableListening();
      }

      this.emit(PickerEvents.pickerStateUpdated, this);
    } else if(this.listening) {
      this._disableListening();
      this.emit(PickerEvents.pickerStateUpdated, this);
    }
  }

  handleEvent(keyboardEvent) {
    const key = keyboardEvent.key;
    if (key === "Escape") {
      this._disableListening();
      this.disableWordCompletion = true;
    } else if (this.listening && isPickerNavigationKeyPress(key)) {
      keyboardEvent.preventDefault();
      this._handleNavInput(key);
    } else if (this.listening && isInputNavigationKeyPress(key)) {
      this._disableListening();
    }
  }

  clearSearch() {
    this._resetSearchState();
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

}

export const emojiPickerStore = new EmojiPickerStore();