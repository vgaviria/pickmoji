import '../styles/index.scss';
import './emojiPicker';
import { emojiPickerStore } from './emojiPickerStore';
import { textInputRegistry } from './textInputRegistry';

document.addEventListener("focusin", () => {
  if (textInputRegistry.canRegisterElement(document.activeElement)) {
    const inputElement = document.activeElement;
    textInputRegistry.registerElement(inputElement);

    const inputBoundingRect = inputElement.getBoundingClientRect()
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
});
