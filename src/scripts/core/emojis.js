import emojiData from 'emoji.json';

/*
Get Emoji mapping from underscored name to unicode bytes. Eventually this
should be pre-processed outside of runtime. The preprocessing script should
strip any other unnecessary properties in the emoji dict.
*/

export const emojis = emojiData;
