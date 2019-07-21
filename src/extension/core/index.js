import '../styles/index.scss';
import './emojiPicker';
import { textInputRegistry } from './textInputRegistry';

document.addEventListener("focusin", () => {
  if (textInputRegistry.canRegisterElement(document.activeElement)) {
    const emojiTextInput = textInputRegistry.registerElement(document.activeElement);
    emojiTextInput.focus();
  }
});
