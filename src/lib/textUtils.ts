function isCJK(codePoint: number): boolean {
  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0x3040 && codePoint <= 0x309f) ||
    (codePoint >= 0x30a0 && codePoint <= 0x30ff) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7af)
  );
}

export function splitTextIntoWords(text: string): string[] {
  const tokens = text
    .replace(/\n/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const result: string[] = [];
  for (const token of tokens) {
    let hasCJKChar = false;
    for (const char of token) {
      const cp = char.codePointAt(0);
      if (cp !== undefined && isCJK(cp)) {
        hasCJKChar = true;
        break;
      }
    }

    if (!hasCJKChar) {
      result.push(token);
      continue;
    }

    let buffer = '';
    for (const char of token) {
      const cp = char.codePointAt(0);
      if (cp !== undefined && isCJK(cp)) {
        if (buffer) {
          result.push(buffer);
          buffer = '';
        }
        result.push(char);
      } else {
        buffer += char;
      }
    }
    if (buffer) {
      result.push(buffer);
    }
  }
  return result;
}

export function isAnnotationWord(word: string): boolean {
  if (word.startsWith('[') && word.endsWith(']')) return true;
  const stripped = word.replace(/[^a-zA-Z0-9]/g, '');
  return stripped.length === 0;
}

export function splitPages(content: string): string[] {
  return content.split(/\n---\n/).map((p) => p.trim());
}

export function joinPages(pages: string[]): string {
  return pages.join('\n---\n');
}
