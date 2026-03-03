import { useRef, useEffect, useMemo, useCallback } from 'react';
import { isAnnotationWord } from '../../lib/textUtils';
import {
  FONT_SIZE_VALUES,
  FONT_FAMILY_CSS,
  FONT_COLOR_VALUES,
} from '../../lib/types';
import type {
  FontSizePreset,
  FontFamilyPreset,
  FontColorPreset,
  ListeningMode,
} from '../../lib/types';
import clsx from 'clsx';

interface WordItem {
  id: number;
  word: string;
  charOffset: number;
  isAnnotation: boolean;
}

interface WordFlowDisplayProps {
  words: string[];
  highlightedCharCount: number;
  fontSize: FontSizePreset;
  fontFamily: FontFamilyPreset;
  fontColor: FontColorPreset;
  listeningMode: ListeningMode;
  smoothWordProgress: number;
  isListening: boolean;
  onWordTap?: (charOffset: number) => void;
}

function buildItems(words: string[]): WordItem[] {
  const items: WordItem[] = [];
  let offset = 0;
  for (let i = 0; i < words.length; i++) {
    items.push({
      id: i,
      word: words[i],
      charOffset: offset,
      isAnnotation: isAnnotationWord(words[i]),
    });
    offset += words[i].length + 1;
  }
  return items;
}

function getActiveWordIndex(
  words: string[],
  highlightedCharCount: number
): number {
  let offset = 0;
  for (let i = 0; i < words.length; i++) {
    const end = offset + words[i].length;
    if (highlightedCharCount <= end) return i;
    offset = end + 1;
  }
  return Math.max(0, words.length - 1);
}

export default function WordFlowDisplay({
  words,
  highlightedCharCount,
  fontSize,
  fontFamily,
  fontColor,
  listeningMode,
  smoothWordProgress,
  isListening,
  onWordTap,
}: WordFlowDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const items = useMemo(() => buildItems(words), [words]);
  const sizeValue = FONT_SIZE_VALUES[fontSize];
  const familyValue = FONT_FAMILY_CSS[fontFamily];
  const colorValue = FONT_COLOR_VALUES[fontColor];

  const isWordTracking = listeningMode === 'wordTracking';
  const highlightWords = isWordTracking;

  const activeWordIndex = isWordTracking
    ? getActiveWordIndex(words, highlightedCharCount)
    : Math.floor(smoothWordProgress);

  const scrollToActiveWord = useCallback(() => {
    if (!containerRef.current || !wordsContainerRef.current) return;
    const containerHeight = containerRef.current.clientHeight;

    const wordEl = wordRefs.current.get(activeWordIndex);
    if (!wordEl) return;

    const wordTop = wordEl.offsetTop;
    const wordHeight = wordEl.offsetHeight;

    if (isWordTracking) {
      const target = wordTop + wordHeight / 2 - containerHeight / 2;
      wordsContainerRef.current.style.transform = `translateY(${-target}px)`;
    } else {
      const fraction = smoothWordProgress - Math.floor(smoothWordProgress);
      const nextEl = wordRefs.current.get(activeWordIndex + 1);
      const nextTop = nextEl ? nextEl.offsetTop : wordTop;
      const interpolated = wordTop + (nextTop - wordTop) * fraction;
      const target = interpolated + wordHeight / 2 - containerHeight + 40;
      wordsContainerRef.current.style.transform = `translateY(${-target}px)`;
    }
  }, [activeWordIndex, isWordTracking, smoothWordProgress]);

  useEffect(() => {
    if (isListening) {
      scrollToActiveWord();
    }
  }, [highlightedCharCount, smoothWordProgress, scrollToActiveWord, isListening]);

  useEffect(() => {
    wordRefs.current.clear();
    if (wordsContainerRef.current) {
      wordsContainerRef.current.style.transform = 'translateY(0px)';
    }
    requestAnimationFrame(() => {
      if (containerRef.current && wordsContainerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        wordsContainerRef.current.style.transform = `translateY(${containerHeight / 2 - sizeValue}px)`;
      }
    });
  }, [words, sizeValue]);

  const nextWordIndex = useMemo(() => {
    for (const item of items) {
      if (item.isAnnotation) continue;
      const charsIntoWord = highlightedCharCount - item.charOffset;
      const letterCount = Math.max(
        1,
        item.word.replace(/[^a-zA-Z0-9]/g, '').length
      );
      const litCount = Math.max(0, Math.min(item.word.length, charsIntoWord));
      if (litCount < letterCount) return item.id;
    }
    return -1;
  }, [items, highlightedCharCount]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden prompter-mask">
      <div
        ref={wordsContainerRef}
        className="px-6 md:px-12 lg:px-20"
        style={{
          transition: isWordTracking
            ? 'transform 0.5s ease-out'
            : 'transform 0.06s linear',
        }}
      >
        <div
          className="flex flex-wrap"
          style={{ fontFamily: familyValue, fontSize: `${sizeValue}px` }}
        >
          {items.map((item) => {
            const wordLen = item.word.length;
            const charsIntoWord = highlightedCharCount - item.charOffset;
            const litCount = Math.max(0, Math.min(wordLen, charsIntoWord));
            const letterCount = Math.max(
              1,
              item.word.replace(/[^a-zA-Z0-9]/g, '').length
            );
            const isFullyLit = litCount >= letterCount;
            const isCurrentWord =
              item.id === nextWordIndex ||
              (charsIntoWord >= 0 && !isFullyLit);

            let wordStyle: React.CSSProperties = {};
            let extraClasses = '';

            if (!highlightWords) {
              wordStyle.color = item.isAnnotation
                ? 'rgba(255,255,255,0.4)'
                : colorValue;
            } else if (item.isAnnotation) {
              wordStyle.color = isFullyLit
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(255,255,255,0.2)';
              wordStyle.fontStyle = 'italic';
            } else if (isFullyLit) {
              wordStyle.color = colorValue;
              wordStyle.opacity = 0.3;
            } else if (isCurrentWord) {
              wordStyle.color = colorValue;
              wordStyle.opacity = 0.6;
              extraClasses = 'underline underline-offset-4';
            } else {
              wordStyle.color = colorValue;
            }

            return (
              <span
                key={item.id}
                ref={(el) => {
                  if (el) wordRefs.current.set(item.id, el);
                }}
                className={clsx(
                  'cursor-pointer select-none leading-[1.6] font-semibold',
                  extraClasses
                )}
                style={{
                  ...wordStyle,
                  textDecorationColor: wordStyle.color as string,
                }}
                onClick={() => onWordTap?.(item.charOffset)}
              >
                {item.word}{' '}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
