#!/usr/bin/env node

/*eslint-env node */
/*eslint no-console: "off"*/

const emojis = require('emoji.json');
const fs = require('fs');
const path = require('path');

const filteredEmojiData = []

for (let i = 0; i < emojis.length; i++) {
  filteredEmojiData.push({
    name: emojis[i].name,
    char: emojis[i].char,
  });
}

try {
  fs.writeFileSync(path.resolve(__dirname, 'data', 'emojis.json'), JSON.stringify(filteredEmojiData));
} catch (e) {
  console.error(e);
}

console.info("Successfully created emojis.json");

/*
 * Experiment with creating a more compact file format.
 */

const emojisStringBuffer = []

for (let i = 0; i < emojis.length; i++) {
  emojisStringBuffer.push(emojis[i].name)
  emojisStringBuffer.push(emojis[i].char)
}

const pipeDelimitedBuffer = emojisStringBuffer.join('|');

try {
  fs.writeFileSync(path.resolve(__dirname, 'data', 'pipe-delimited-emojis'), pipeDelimitedBuffer);
} catch (e) {
  console.error(e);
}

console.info("Successfully created pipe-delimited-emojis");
