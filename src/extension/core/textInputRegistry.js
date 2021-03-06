import { EmojiTextInput } from './emojiTextInput';

export class EmojiTextInputRegistry {
  constructor() {
    this._registry = {}
  }

  _createRandomId() {
    return `pickmoji-text-input-${Math.round(Math.random() * 1000000000)}`;
  }

  canRegisterElement(htmlNode) {
    if (htmlNode.tagName.toLowerCase() === 'input' && htmlNode.attributes.getNamedItem('type').value === 'textbox') {
      return true;
    }
    return false;
  }

  registerElement(inputElement) {
    if (!this.canRegisterElement(inputElement)) {
      throw Error('Cannot register element ${inputElement}');
    }

    if (!inputElement.id || !this._registry[inputElement.id]) {
      inputElement.id = inputElement.id || this._createRandomId();
      this._registry[inputElement.id] = new EmojiTextInput(inputElement);
      console.debug(`Registering element with id ${inputElement.id}`);
    }

    return this._registry[inputElement.id];
  }

  get(id) {
    return this._registry[id];
  }
}

export const textInputRegistry = new EmojiTextInputRegistry();
