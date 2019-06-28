import emojis from 'emoji.json';

/*
Get Emoji mapping from underscored name to unicode bytes. Eventually this
should be pre-processed outside of runtime. The preprocessing script should
strip any other unnecessary properties in the emoji dict.
*/

export const emojiIndex = {};

emojis.forEach((emoji) => {
  emojiIndex[emoji.name] = emoji;
});

export const emojiNames = Object.keys(emojiIndex);

// export default {
//   emojiNames: Object.keys(emojiIndex),
//   emojiIndex: emojiIndex,
// };
