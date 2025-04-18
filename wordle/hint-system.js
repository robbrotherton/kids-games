// hint-system.js: Modular hint logic for Wordle

/**
 * Generate a part-of-speech hint from a dictionary API response.
 * @param {Array} dictEntries - Array of dictionary entries from the API
 * @returns {string|null} - A hint string or null if no part of speech found
 */
window.getPartOfSpeechHint = function(dictEntries) {
  if (!Array.isArray(dictEntries)) return null;
  // Collect all unique parts of speech (fl fields)
  const fls = Array.from(new Set(
    dictEntries
      .filter(e => e.fl && e.shortdef && e.shortdef.length > 0)
      .map(e => e.fl)
  ));
  if (fls.length === 0) return null;
  if (fls.length === 1) {
    return `It's a ${fls[0]}.`;
  }
  if (fls.length === 2) {
    return `Can be a ${fls[0]} or ${fls[1]}.`;
  }
  // For 3 or more, use commas and 'or'
  const last = fls.pop();
  return `Can be a ${fls.join(', ')}, or ${last}.`;
};

/**
 * If the dictionary entry contains a cxs field indicating this word is a past tense/participle/etc,
 * return a hint like "Past tense of hold".
 */
function getFormHint(dictEntries) {
  for (const entry of dictEntries) {
    if (entry.cxs && Array.isArray(entry.cxs)) {
      for (const cxsItem of entry.cxs) {
        if (
          cxsItem.cxl &&
          (cxsItem.cxl.includes("past tense") || cxsItem.cxl.includes("past participle"))
        ) {
          // Get the base word from cxtis
          if (cxsItem.cxtis && Array.isArray(cxsItem.cxtis) && cxsItem.cxtis[0] && cxsItem.cxtis[0].cxt) {
            return `${cxsItem.cxl.charAt(0).toUpperCase() + cxsItem.cxl.slice(1)} ${cxsItem.cxtis[0].cxt}`;
          }
        }
      }
    }
  }
  return null;
}

// Export or attach to window if needed
window.getFormHint = getFormHint;


/**
 * Returns an array of hints: part-of-speech, examples, definitions, synonyms
 * @param {Array} dictEntries - Array of dictionary entries from the API
 * @param {string} word - The word to generate hints for
 * @returns {Array} - Array of hint strings
 */
window.getAllHints = function(dictEntries, word) {
  if (!Array.isArray(dictEntries)) return ['No hint available.'];
  const hints = [];
  // Part-of-speech hint
  const posHint = window.getPartOfSpeechHint(dictEntries);
  if (posHint) hints.push(posHint);

  // FORM HINT (e.g., "Past tense of hold")
  const formHint = window.getFormHint(dictEntries);
  if (formHint) {
    hints.push(formHint);
  }

  // Example sentences (with word blanked out)
  const exampleHints = [];
  const wordRegex = new RegExp(word, 'ig');
  dictEntries.forEach(e => {
    if (e.def && Array.isArray(e.def)) {
      e.def.forEach(defBlock => {
        if (defBlock.sseq && Array.isArray(defBlock.sseq)) {
          defBlock.sseq.forEach(sseqItem => {
            if (Array.isArray(sseqItem)) {
              sseqItem.forEach(sense => {
                if (sense[1] && sense[1].dt && Array.isArray(sense[1].dt)) {
                  sense[1].dt.forEach(dtItem => {
                    if (dtItem[0] === 'vis' && Array.isArray(dtItem[1])) {
                      dtItem[1].forEach(visObj => {
                        if (visObj.t) {
                          let example = visObj.t.replace(wordRegex, '_____');
                          example = example.replace(/{.*?}/g, '');
                          if (example && !exampleHints.includes(example)) {
                            exampleHints.push('Example: ' + example);
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
  exampleHints.forEach(hint => hints.push(hint));
  // Definitions (shortdefs)
  const defs = [];
  dictEntries.forEach(e => {
    if (e.shortdef && Array.isArray(e.shortdef)) {
      e.shortdef.forEach(def => {
        if (def && !defs.includes(def)) defs.push(def);
      });
    }
  });
  defs.forEach(def => hints.push(def));
  // Synonyms
  const synonyms = [];
  dictEntries.forEach(e => {
    if (e.syn_list && Array.isArray(e.syn_list)) {
      e.syn_list.forEach(synArr => {
        if (Array.isArray(synArr)) {
          synArr.forEach(synObj => {
            if (synObj.wd && !synonyms.includes(synObj.wd)) {
              synonyms.push(synObj.wd);
            }
          });
        }
      });
    }
  });
  if (synonyms.length > 0) {
    hints.push('Synonyms: ' + synonyms.join(', '));
  }
  return hints.length > 0 ? hints : ['No hint available.'];
};