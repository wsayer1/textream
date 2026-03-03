import { create } from 'zustand';
import { splitTextIntoWords } from '../lib/textUtils';
import { matchCharacters } from '../lib/fuzzyMatch';

interface PrompterStore {
  pages: string[];
  currentPageIndex: number;
  words: string[];
  sourceText: string;
  recognizedCharCount: number;
  matchStartOffset: number;
  lastSpokenText: string;
  isActive: boolean;
  isComplete: boolean;
  smoothWordProgress: number;
  smoothTimerActive: boolean;

  setPages: (pages: string[]) => void;
  startPage: (index: number) => void;
  handleSpeechResult: (transcript: string) => void;
  jumpToWord: (charOffset: number) => void;
  nextPage: () => boolean;
  prevPage: () => boolean;
  jumpToPage: (index: number) => void;
  reset: () => void;
  setComplete: (val: boolean) => void;
  setSmoothWordProgress: (val: number) => void;
  setSmoothTimerActive: (val: boolean) => void;
}

export const usePrompterStore = create<PrompterStore>((set, get) => ({
  pages: [],
  currentPageIndex: 0,
  words: [],
  sourceText: '',
  recognizedCharCount: 0,
  matchStartOffset: 0,
  lastSpokenText: '',
  isActive: false,
  isComplete: false,
  smoothWordProgress: 0,
  smoothTimerActive: false,

  setPages: (pages) => set({ pages }),

  startPage: (index) => {
    const { pages } = get();
    if (index < 0 || index >= pages.length) return;
    const text = pages[index].trim();
    const words = splitTextIntoWords(text);
    const collapsed = words.join(' ');
    set({
      currentPageIndex: index,
      words,
      sourceText: collapsed,
      recognizedCharCount: 0,
      matchStartOffset: 0,
      lastSpokenText: '',
      isActive: true,
      isComplete: false,
      smoothWordProgress: 0,
      smoothTimerActive: false,
    });
  },

  handleSpeechResult: (transcript) => {
    const { sourceText, matchStartOffset, recognizedCharCount } = get();
    if (!sourceText) return;
    const newCount = matchCharacters(
      sourceText,
      matchStartOffset,
      transcript,
      recognizedCharCount
    );
    set({ recognizedCharCount: newCount, lastSpokenText: transcript });
  },

  jumpToWord: (charOffset) => {
    set({
      recognizedCharCount: charOffset,
      matchStartOffset: charOffset,
    });
  },

  nextPage: () => {
    const { pages, currentPageIndex } = get();
    let next = currentPageIndex + 1;
    while (next < pages.length) {
      if (pages[next].trim()) break;
      next++;
    }
    if (next >= pages.length) return false;
    get().startPage(next);
    return true;
  },

  prevPage: () => {
    const { pages, currentPageIndex } = get();
    let prev = currentPageIndex - 1;
    while (prev >= 0) {
      if (pages[prev].trim()) break;
      prev--;
    }
    if (prev < 0) return false;
    get().startPage(prev);
    return true;
  },

  jumpToPage: (index) => {
    get().startPage(index);
  },

  reset: () => {
    set({
      words: [],
      sourceText: '',
      recognizedCharCount: 0,
      matchStartOffset: 0,
      lastSpokenText: '',
      isActive: false,
      isComplete: false,
      smoothWordProgress: 0,
      smoothTimerActive: false,
    });
  },

  setComplete: (val) => set({ isComplete: val }),
  setSmoothWordProgress: (val) => set({ smoothWordProgress: val }),
  setSmoothTimerActive: (val) => set({ smoothTimerActive: val }),
}));
