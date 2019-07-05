import fuzzysearch from 'fuzzysearch';

import { CHAR_THRESHOLD, SUGGESTION_MAX, PickerEvents } from './constants';
import { isNavigationKeyPress } from './helpers';
import { emojiNames, emojiIndex } from './emojis';
import {EventEmitter} from './eventEmitter';

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
