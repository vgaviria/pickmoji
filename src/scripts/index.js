import '../styles/index.scss';
import { emojiPickerStore, PickerEvents } from './core';

class EmojiPickerStoreDebugElement {
  constructor() {
    this.stateDebugElement = document.getElementById("picker-state");
  }

  update(state) {
    const emojis = state.suggestedEmojis.map((emoji) => emoji.char);
    this.stateDebugElement.innerHTML = `
      <div>IsListening: ${state.listening}</div>
      <div>Search Term: ${state.searchTerm}</div>
      <div class="emoji">Suggestions: ${emojis}</div>
    `;
  }
}

const debugElement = new EmojiPickerStoreDebugElement();

emojiPickerStore.on(PickerEvents.pickerStateUpdated, (state) => debugElement.update(state));
