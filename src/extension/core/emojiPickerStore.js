import { WeightedFuzzySearcher } from './fuzzySearch';
import { PickerEvents, InputEvents} from './constants';
import { isInputNavigationKeyPress, isPickerNavigationKeyPress } from './helpers';
import { EventEmitter } from './eventEmitter';
import { eventDispatcher } from './eventDispatcher';
import { textInputRegistry } from './textInputRegistry';

import emojis from '../data/emojis.json';


class EmojiPickerStore extends EventEmitter {
  constructor() {
    super();
    this.inputState = {};
    this.reverseDisplay = false;
    this.currentSearchTerm = null;
    this.currentChoiceIndex = 0;
    this.suggestedEmojis = [];

    this.fuzzySearcher = new WeightedFuzzySearcher(emojis, {
      itemId: 'name',
      numResults: 5,
    });

    eventDispatcher.register(InputEvents.keyDown, this.handleKeyPress.bind(this));
    eventDispatcher.register(InputEvents.inputBlur, this.handleInputBlur.bind(this));
    eventDispatcher.register(InputEvents.inputFocused, this.handleInputFocused.bind(this));
    eventDispatcher.register(InputEvents.searchTermChanged, this.handleSearchTermChanged.bind(this));
    eventDispatcher.register(PickerEvents.suggestionClicked, this.handleSuggestionPicked.bind(this));
  }

  _isActive() {
    return !!this.currentSearchTerm;
  }

  _populateSuggestions(searchTerm) {
    const _perfTimeStart = performance.now();

    if (searchTerm) {
      this.suggestedEmojis = this.fuzzySearcher.search(searchTerm);
    } else {
      this.suggestedEmojis = [];
    }

    const _perfTimeEnd = performance.now();

    console.debug(`
      ${this.suggestedEmojis.length} suggestion results found for search
      term "${searchTerm}" in ${_perfTimeEnd - _perfTimeStart}ms
    `);
  }

  _resetSearchState() {
    this.suggestedEmojis = [];
    this.currentChoiceIndex = 0;
    this.currentSearchTerm = null;

    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _highlightNextEmoji() {
    const suggestionsLength = this.suggestedEmojis.length;
    this.currentChoiceIndex = (this.currentChoiceIndex + 1) % suggestionsLength;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _highlightPreviousEmoji() {
    const suggestionsLength = this.suggestedEmojis.length;
    this.currentChoiceIndex = (this.currentChoiceIndex + suggestionsLength - 1) % suggestionsLength;
    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  _selectCurrentEmoji() {
    const emoji = this.suggestedEmojis[this.currentChoiceIndex];
    const emojiTextInput = textInputRegistry.get(this.inputState.id);

    emojiTextInput.replaceSearchTermWithEmoji(emoji.char);

    this._resetSearchState();
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
      this._resetSearchState();
    } else if (navInputKey === 'ArrowRight') {
      this._resetSearchState();
    }
  }

  handleInputFocused(inputFocusedEvent) {
    const { input, viewport } = inputFocusedEvent;
    const reverseDisplayThreshold = viewport.location.y + (viewport.height * .60)

    this.reverseDisplay = input.location.y > reverseDisplayThreshold
    this.inputState = input;

    this.clearSearch();
  }

  handleInputBlur() {
    this.clearSearch();
  }

  handleSearchTermChanged({ searchTerm }) {
    if (searchTerm) {
      this.currentSearchTerm = searchTerm;
      this._populateSuggestions(searchTerm);
    }

    if (this.suggestedEmojis.length <= 0) {
      this._resetSearchState();
    }

    this.emit(PickerEvents.pickerStateUpdated, this);
  }

  handleKeyPress({ key }) {
    if (!this._isActive()) {
      return;
    } else if (key === "Escape") {
      this._resetSearchState();
    } else if (isPickerNavigationKeyPress(key)) {
      this._handleNavInput(key);
    } else if (isInputNavigationKeyPress(key)) {
      this._resetSearchState();
    }
  }

  handleSuggestionPicked({ suggestionId }) {
    this.currentChoiceIndex = suggestionId;
    if (this._isActive()) {
      this._selectCurrentEmoji();
    }
  }

  clearSearch() {
    this._resetSearchState();
  }

}

export const emojiPickerStore = new EmojiPickerStore();
