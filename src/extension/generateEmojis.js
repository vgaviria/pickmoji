#!/usr/bin/env node

/*eslint-env node */
/*eslint no-console: "off"*/

const rawEmojiData = require('emoji.json');
const fs = require('fs');
const path = require('path');

// http://cldr.unicode.org/translation/short-names-and-keywords
const CONSTRUCTED_EMOJI_PERSON_ATTRIBUTES_INDEX = {
  light_skin_tone: "L",
  medium_light_skin_tone: "ML",
  medium_skin_tone: "M",
  medium_dark_skin_tone: "MD",
  dark_skin_tone: "D",
  red_hair: "RH",
  blond_hair: "BH",
  white_hair: "WH",
  curly_hair: "CH",
  beard: "BE",
  bald: "BA",
}

function _isConstructedEmojiWithPersonAttributes(constructedParts) {
  const attributeParts = constructedParts.filter(p => CONSTRUCTED_EMOJI_PERSON_ATTRIBUTES_INDEX[p]);
  return attributeParts.length > 0;
}

function _formatConstructedEmoji(baseEmojiName, constructedParts) {
  let constructedPartIds;

  if (_isConstructedEmojiWithPersonAttributes(constructedParts)) {
    constructedPartIds = constructedParts.map((c) => {
      return CONSTRUCTED_EMOJI_PERSON_ATTRIBUTES_INDEX[c]
    });
  } else {
    constructedPartIds = constructedParts;
  }

  return baseEmojiName + ':' + constructedPartIds.join('-');
}

/**
 * The emoji.json package has duplicate names for different emoji characters.
 * We remove the duplicates and prefer the first emoji found with a particular
 * name.
 */
function removeDuplicateEmojis(emojiData) {
  const nameIndex = {};
  const filteredEmojiData = [];
  const duplicateNames = [];

  for (let i = 0; i < emojiData.length; i++) {
    if (!nameIndex[emojiData[i].name]) {
      filteredEmojiData.push(emojiData[i]);
    } else {
      duplicateNames.push(emojiData[i].name);
    }
    nameIndex[emojiData[i].name] = true;
  }

  return filteredEmojiData;
}

/**
 * Format the emoji names to be lowercase, with spaces replaces with
 * underscores, and the skin tones replaced with shorter unique ids.
 */
function formatEmojiNames(emojiData) {
  for (let i = 0; i < emojiData.length; i++) {
    const constructedPartStart = emojiData[i].name.indexOf(":");
    let newName;

    if (constructedPartStart >= 0) {
      const baseEmojiName = emojiData[i].name.toLowerCase()
        .substr(0, constructedPartStart).trim()
        .replace(/\s/g, '_');
      const constructedParts = emojiData[i].name.toLowerCase()
        .substr(constructedPartStart + 1).trim().split(',')
        .map(p => p.trim().replace(/(\s|-)/g, '_'))
      newName = _formatConstructedEmoji(baseEmojiName, constructedParts)
    } else {
      newName = emojiData[i].name.toLowerCase().replace(/(\s|-)/g, "_");
    }

    emojiData[i].name = newName;
  }
}

function generateEmojiJSON(emojiData) {
  const filteredEmojiData = [];

  for (let i = 0; i < emojiData.length; i++) {
    filteredEmojiData.push({
      name: emojiData[i].name,
      char: emojiData[i].char,
    });
  }

  try {
    fs.writeFileSync(path.resolve(__dirname, 'data', 'emojis.json'), JSON.stringify(filteredEmojiData));
  } catch (e) {
    console.error(e);
  }

  console.info("Successfully created emojis.json");
}

/*
 * TODO: Experiment with creating a more compact file format. This is not being
 * used right now, and should be evaluated to be used in the future.
 */
function generateCompactEmojiTextFile(emojiData) {
  const stringBuffer = []

  for (let i = 0; i < emojiData.length; i++) {
    stringBuffer.push(emojiData[i].name + "|" + emojiData[i].char)
  }

  const pipeDelimitedBuffer = stringBuffer.join('\n');

  try {
    fs.writeFileSync(path.resolve(__dirname, 'data', 'pipe-delimited-emojis'), pipeDelimitedBuffer);
  } catch (e) {
    console.error(e);
  }

  console.info("Successfully created pipe-delimited-emojis");
}

(function() {
  const emojiData = removeDuplicateEmojis(rawEmojiData);
  formatEmojiNames(emojiData);

  if (!fs.existsSync(path.resolve(__dirname, 'data'))) {
    fs.mkdirSync(path.resolve(__dirname, 'data'));
  }

  generateEmojiJSON(emojiData);
  generateCompactEmojiTextFile(emojiData);
})();
