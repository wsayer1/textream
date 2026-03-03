import { isAnnotationWord } from './textUtils';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAlphanumeric(ch: string): boolean {
  return /[a-z0-9]/i.test(ch);
}

function editDistance(a: string, b: string): number {
  const aArr = Array.from(a);
  const bArr = Array.from(b);
  const dp = Array.from({ length: bArr.length + 1 }, (_, i) => i);

  for (let i = 1; i <= aArr.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= bArr.length; j++) {
      const temp = dp[j];
      dp[j] =
        aArr[i - 1] === bArr[j - 1]
          ? prev
          : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = temp;
    }
  }
  return dp[bArr.length];
}

function isFuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  if (a.includes(b) || b.includes(a)) return true;

  let shared = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) shared++;
    else break;
  }
  const shorter = Math.min(a.length, b.length);
  if (shorter >= 2 && shared >= Math.max(2, Math.floor((shorter * 3) / 5)))
    return true;

  const dist = editDistance(a, b);
  if (shorter <= 4) return dist <= 1;
  if (shorter <= 8) return dist <= 2;
  return dist <= Math.floor(Math.max(a.length, b.length) / 3);
}

function charLevelMatch(
  sourceText: string,
  matchStartOffset: number,
  spoken: string
): number {
  const remaining = sourceText.slice(matchStartOffset);
  const src = Array.from(remaining.toLowerCase());
  const spk = Array.from(normalize(spoken));

  let si = 0;
  let ri = 0;
  let lastGoodOrigIndex = 0;

  while (si < src.length && ri < spk.length) {
    const sc = src[si];
    const rc = spk[ri];

    if (!isAlphanumeric(sc)) {
      si++;
      continue;
    }
    if (!isAlphanumeric(rc)) {
      ri++;
      continue;
    }

    if (sc === rc) {
      si++;
      ri++;
      lastGoodOrigIndex = si;
    } else {
      let found = false;

      const maxSkipR = Math.min(3, spk.length - ri - 1);
      if (maxSkipR >= 1) {
        for (let skipR = 1; skipR <= maxSkipR; skipR++) {
          const nextRI = ri + skipR;
          if (nextRI < spk.length && spk[nextRI] === sc) {
            ri = nextRI;
            found = true;
            break;
          }
        }
      }
      if (found) continue;

      const maxSkipS = Math.min(3, src.length - si - 1);
      if (maxSkipS >= 1) {
        for (let skipS = 1; skipS <= maxSkipS; skipS++) {
          const nextSI = si + skipS;
          if (nextSI < src.length && src[nextSI] === rc) {
            si = nextSI;
            found = true;
            break;
          }
        }
      }
      if (found) continue;

      si++;
      ri++;
      lastGoodOrigIndex = si;
    }
  }

  return lastGoodOrigIndex;
}

function wordLevelMatch(
  sourceText: string,
  matchStartOffset: number,
  spoken: string
): number {
  const remaining = sourceText.slice(matchStartOffset);
  const sourceWords = remaining.split(' ').filter(Boolean);
  const spokenWords = spoken
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

  let si = 0;
  let ri = 0;
  let matchedCharCount = 0;

  while (si < sourceWords.length && ri < spokenWords.length) {
    if (isAnnotationWord(sourceWords[si])) {
      matchedCharCount += sourceWords[si].length;
      if (si < sourceWords.length - 1) matchedCharCount += 1;
      si++;
      continue;
    }

    const srcWord = sourceWords[si]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const spkWord = spokenWords[ri].replace(/[^a-z0-9]/g, '');

    if (srcWord === spkWord || isFuzzyMatch(srcWord, spkWord)) {
      matchedCharCount += sourceWords[si].length;
      if (si < sourceWords.length - 1) matchedCharCount += 1;
      si++;
      ri++;
    } else {
      let foundSpk = false;
      const maxSpkSkip = Math.min(3, spokenWords.length - ri - 1);
      for (let skip = 1; skip <= maxSpkSkip; skip++) {
        const nextSpk = spokenWords[ri + skip].replace(/[^a-z0-9]/g, '');
        if (srcWord === nextSpk || isFuzzyMatch(srcWord, nextSpk)) {
          ri += skip;
          foundSpk = true;
          break;
        }
      }
      if (foundSpk) continue;

      let foundSrc = false;
      const maxSrcSkip = Math.min(3, sourceWords.length - si - 1);
      for (let skip = 1; skip <= maxSrcSkip; skip++) {
        const nextSrc = sourceWords[si + skip]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        if (nextSrc === spkWord || isFuzzyMatch(nextSrc, spkWord)) {
          for (let s = 0; s < skip; s++) {
            matchedCharCount += sourceWords[si + s].length + 1;
          }
          si += skip;
          foundSrc = true;
          break;
        }
      }
      if (foundSrc) continue;

      if (srcWord.length === 0) {
        matchedCharCount += sourceWords[si].length;
        if (si < sourceWords.length - 1) matchedCharCount += 1;
        si++;
        continue;
      }

      ri++;
    }
  }

  while (si < sourceWords.length && isAnnotationWord(sourceWords[si])) {
    matchedCharCount += sourceWords[si].length;
    if (si < sourceWords.length - 1) matchedCharCount += 1;
    si++;
  }

  return matchedCharCount;
}

export function matchCharacters(
  sourceText: string,
  matchStartOffset: number,
  spoken: string,
  currentCharCount: number
): number {
  const charResult = charLevelMatch(sourceText, matchStartOffset, spoken);
  const wordResult = wordLevelMatch(sourceText, matchStartOffset, spoken);
  const best = Math.max(charResult, wordResult);
  const newCount = matchStartOffset + best;

  if (newCount > currentCharCount) {
    return Math.min(newCount, sourceText.length);
  }
  return currentCharCount;
}
