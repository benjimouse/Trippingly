// frontend/src/utils/speechUtils.js

/**
 * Rebuilds the displayed speech content from the original clean text,
 * a list of associations, and a map of their toggle states.
 * @param {string} clean - The original, unmodified speech text.
 * @param {Array} assocList - An array of association objects.
 * @param {Object} toggleMap - A map of association IDs to their toggle state (true for original text, false for emoji).
 * @returns {string} The resulting string with emojis or original text.
 */
export const buildDisplayedContent = (clean, assocList, toggleMap) => {
  let out = '';
  let idx = 0;
  for (const a of assocList) {
    if (a.position > idx) {
      out += clean.substring(idx, a.position);
    }
    out += (toggleMap[a.id] ? a.originalText : a.emoji);
    idx = a.position + a.length;
  }
  if (idx < clean.length) {
    out += clean.substring(idx);
  }
  return out;
};
