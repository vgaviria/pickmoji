import '../styles/index.scss';
import './emojiPicker';
import { textInputRegistry } from './textInputRegistry';

document.addEventListener("focusin", () => {
  if (textInputRegistry.canRegisterElement(document.activeElement)) {
    textInputRegistry.registerElement(document.activeElement);
  }
});
