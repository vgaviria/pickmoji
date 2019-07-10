const PARTIAL_DEVIATION_MIN = 0.000001; // A non-zero epsilon value
const PARTIAL_DEVIATION_MAX = Infinity;

export class WeightedFuzzySearcher {

  constructor(collection, options) {
    this.itemId = options.itemId;
    this.numResults = options.numResults;

    this.collection = collection;
  }

  /**
   * Get the fuzzy search deviation score for the searchTerm against the target
   * string. The scoring rules are as follows:
   *    - All exact matches will return 0
   *
   *    - All exact substring matches of the searchTerm within the target will
   *    be within the range PARTIAL_DEVIATION_MIN <= score < 1. If the substring
   *    is at the beginning of the target then the score is
   *    (PARTIAL_DEVIATION_MIN * target.length)
   *
   *    - All ordered fuzzy matches will return a decimal where the fractional
   *    part follows the same rules as an exact substring match, and the whole
   *    number part will indicate the number of spaces between the matched
   *    characters
   *
   *    - All unmatched search terms will return the constant Infinity
   *
   * @param {string} searchTerm The search term
   * @param {string} target The target string being weighted against
   * @return {number} The deviation score as described in the description.
   */
  _getDeviationScore(searchTerm, target) {
    let deviationScore = PARTIAL_DEVIATION_MAX;

    let searchStartingIndex = target.indexOf(searchTerm);

    if (searchStartingIndex === 0) {
      return PARTIAL_DEVIATION_MIN * target.length;
    } else if (searchStartingIndex === -1) {
      searchStartingIndex = target.indexOf(searchTerm[0]);
    }

    if (searchStartingIndex != -1) {
      let currentTermCharIndex = 0;
      let charSpaces = 0;

      for (let i = searchStartingIndex; i < target.length; i++) {
        if (currentTermCharIndex >= searchTerm.length) {
          break;
        } else if (target[i] === searchTerm[currentTermCharIndex]) {
          currentTermCharIndex++;
        } else {
          charSpaces += 1;
        }
      }

      if (currentTermCharIndex < searchTerm.length) {
        return PARTIAL_DEVIATION_MAX;
      }

      deviationScore = (1 - (searchTerm.length / target.length)) + charSpaces;
    }

    return deviationScore;
  }

  search(searchTerm) {
    let matches = [];
    let scoreIndex = {};

    for (let item of this.collection) {
      const itemScore = this._getDeviationScore(searchTerm, item[this.itemId]);
      if (itemScore != Infinity) {
        matches.push(item);
        scoreIndex[item[this.itemId]] = itemScore;
      }
    }

    matches.sort((m1, m2) => scoreIndex[m1[this.itemId]] - scoreIndex[m2[this.itemId]]);

    if (this.numResults) {
      matches = matches.slice(0, this.numResults);
    }

    return matches
  }
}
