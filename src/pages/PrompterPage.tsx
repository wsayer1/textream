import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrompterStore } from '../stores/prompterStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioLevels } from '../hooks/useAudioLevels';
import WordFlowDisplay from '../components/prompter/WordFlowDisplay';
import AudioWaveform from '../components/prompter/AudioWaveform';
import ElapsedTime from '../components/prompter/ElapsedTime';
import PagePicker from '../components/prompter/PagePicker';
import clsx from 'clsx';

export default function PrompterPage() {
  const navigate = useNavigate();
  const prompter = usePrompterStore();
  const settings = useSettingsStore();
  const audioLevels = useAudioLevels();

  const [showPagePicker, setShowPagePicker] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [entered, setEntered] = useState(false);

  const smoothTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const needsMic =
    settings.listening_mode === 'wordTracking' ||
    settings.listening_mode === 'silencePaused';

  const onSpeechResult = useCallback(
    (transcript: string) => {
      if (settings.listening_mode === 'wordTracking') {
        prompter.handleSpeechResult(transcript);
      }
    },
    [settings.listening_mode, prompter]
  );

  const speech = useSpeechRecognition({
    locale: settings.speech_locale,
    onResult: onSpeechResult,
  });

  useEffect(() => {
    if (!prompter.isActive) {
      navigate('/');
      return;
    }
    requestAnimationFrame(() => setEntered(true));
  }, [prompter.isActive, navigate]);

  useEffect(() => {
    if (!prompter.isActive) return;
    if (needsMic) {
      speech.start();
      audioLevels.start();
    }
    return () => {
      speech.stop();
      audioLevels.stop();
    };
  }, [prompter.isActive, needsMic]);

  useEffect(() => {
    const mode = settings.listening_mode;
    if (mode === 'classic' || mode === 'silencePaused') {
      const wordsPerSecond = settings.scroll_speed;
      const intervalMs = 50;
      const progressPerTick = wordsPerSecond / (1000 / intervalMs);

      smoothTimerRef.current = setInterval(() => {
        const state = usePrompterStore.getState();
        if (!state.isActive || state.isComplete) return;

        if (mode === 'silencePaused') {
          const recent = audioLevels.levels.slice(-10);
          const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
          if (avg < 0.08) return;
        }

        if (isPaused) return;

        const newProgress = state.smoothWordProgress + progressPerTick;
        if (newProgress >= state.words.length) {
          state.setSmoothWordProgress(state.words.length);
          state.setComplete(true);
          if (smoothTimerRef.current) clearInterval(smoothTimerRef.current);
        } else {
          state.setSmoothWordProgress(newProgress);
        }
      }, intervalMs);

      return () => {
        if (smoothTimerRef.current) clearInterval(smoothTimerRef.current);
      };
    }
  }, [settings.listening_mode, settings.scroll_speed, isPaused, audioLevels.levels]);

  const totalChars = prompter.sourceText.length;
  const progress = totalChars > 0 ? prompter.recognizedCharCount / totalChars : 0;
  const isPageComplete =
    settings.listening_mode === 'wordTracking'
      ? progress >= 0.95
      : prompter.isComplete;

  const hasNextPage = (() => {
    for (let i = prompter.currentPageIndex + 1; i < prompter.pages.length; i++) {
      if (prompter.pages[i].trim()) return true;
    }
    return false;
  })();

  const isLastPage = !hasNextPage;

  useEffect(() => {
    if (isPageComplete && !prompter.isComplete) {
      prompter.setComplete(true);
    }
  }, [isPageComplete, prompter]);

  useEffect(() => {
    if (
      prompter.isComplete &&
      settings.auto_next_page &&
      hasNextPage
    ) {
      let count = settings.auto_next_page_delay;
      setAutoAdvanceCountdown(count);
      countdownRef.current = setInterval(() => {
        count--;
        if (count <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setAutoAdvanceCountdown(null);
          handleNextPage();
        } else {
          setAutoAdvanceCountdown(count);
        }
      }, 1000);

      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    } else {
      setAutoAdvanceCountdown(null);
    }
  }, [prompter.isComplete, settings.auto_next_page, hasNextPage]);

  const handleClose = useCallback(() => {
    speech.stop();
    audioLevels.stop();
    prompter.reset();
    navigate('/');
  }, [speech, audioLevels, prompter, navigate]);

  const handleNextPage = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setAutoAdvanceCountdown(null);
    speech.stop();
    prompter.nextPage();
    if (needsMic) {
      setTimeout(() => speech.start(), 300);
    }
  }, [prompter, speech, needsMic]);

  const handlePrevPage = useCallback(() => {
    speech.stop();
    prompter.prevPage();
    if (needsMic) {
      setTimeout(() => speech.start(), 300);
    }
  }, [prompter, speech, needsMic]);

  const handlePageSelect = useCallback(
    (index: number) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setAutoAdvanceCountdown(null);
      speech.stop();
      prompter.jumpToPage(index);
      if (needsMic) {
        setTimeout(() => speech.start(), 300);
      }
    },
    [prompter, speech, needsMic]
  );

  const handleWordTap = useCallback(
    (charOffset: number) => {
      prompter.jumpToWord(charOffset);
      prompter.setComplete(false);
      if (speech.isListening) {
        speech.stop();
        setTimeout(() => speech.start(), 200);
      }
    },
    [prompter, speech]
  );

  const handleMicToggle = useCallback(() => {
    if (speech.isListening) {
      speech.stop();
      audioLevels.stop();
    } else {
      speech.start();
      audioLevels.start();
    }
  }, [speech, audioLevels]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === ' ') {
        e.preventDefault();
        if (settings.listening_mode === 'classic') {
          setIsPaused((p) => !p);
        } else if (needsMic) {
          handleMicToggle();
        }
      }
      if (e.key === 'ArrowRight' && hasNextPage) handleNextPage();
      if (e.key === 'ArrowLeft' && prompter.currentPageIndex > 0)
        handlePrevPage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    handleClose,
    handleNextPage,
    handlePrevPage,
    handleMicToggle,
    hasNextPage,
    needsMic,
    settings.listening_mode,
    prompter.currentPageIndex,
  ]);

  const smoothProgress =
    prompter.words.length > 0
      ? prompter.smoothWordProgress / prompter.words.length
      : 0;
  const displayProgress =
    settings.listening_mode === 'wordTracking' ? progress : smoothProgress;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-40 bg-black flex flex-col transition-all duration-500',
        entered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
    >
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Exit (Esc)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>

          {prompter.pages.length > 1 && (
            <button
              onClick={() => setShowPagePicker(true)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white/70 transition-colors"
            >
              Page {prompter.currentPageIndex + 1} / {prompter.pages.length}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {settings.show_elapsed_time && <ElapsedTime />}

          {needsMic && (
            <button
              onClick={handleMicToggle}
              className={clsx(
                'w-9 h-9 flex items-center justify-center rounded-full transition-colors',
                speech.isListening
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              )}
              title={speech.isListening ? 'Mute mic' : 'Unmute mic'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                {speech.isListening ? (
                  <path d="M8 1a2.5 2.5 0 00-2.5 2.5v4a2.5 2.5 0 005 0v-4A2.5 2.5 0 008 1zM4 7a.5.5 0 00-1 0 5 5 0 004.5 4.975V14H6a.5.5 0 000 1h4a.5.5 0 000-1H8.5v-2.025A5 5 0 0013 7a.5.5 0 00-1 0 4 4 0 01-8 0z" />
                ) : (
                  <>
                    <path d="M8 1a2.5 2.5 0 00-2.5 2.5v4a2.5 2.5 0 005 0v-4A2.5 2.5 0 008 1z" opacity="0.3" />
                    <path
                      d="M2 2l12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>
          )}

          {settings.listening_mode === 'classic' && (
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
            >
              {isPaused ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M3 1.5v11l9-5.5-9-5.5z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="3" y="2" width="3" height="10" rx="0.5" />
                  <rect x="8" y="2" width="3" height="10" rx="0.5" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <WordFlowDisplay
          words={prompter.words}
          highlightedCharCount={prompter.recognizedCharCount}
          fontSize={settings.font_size}
          fontFamily={settings.font_family}
          fontColor={settings.font_color}
          listeningMode={settings.listening_mode}
          smoothWordProgress={prompter.smoothWordProgress}
          isListening={speech.isListening || settings.listening_mode === 'classic'}
          onWordTap={handleWordTap}
        />

        {prompter.isComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold text-white">
                {isLastPage ? 'Done!' : 'Page Complete'}
              </div>
              {autoAdvanceCountdown !== null && (
                <div className="text-sm text-neutral-400">
                  Next page in {autoAdvanceCountdown}s
                </div>
              )}
              <div className="flex items-center gap-3 justify-center">
                {hasNextPage && (
                  <button
                    onClick={handleNextPage}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Next Page
                  </button>
                )}
                {isLastPage && (
                  <button
                    onClick={() => {
                      prompter.startPage(0);
                      if (needsMic) {
                        speech.stop();
                        setTimeout(() => speech.start(), 300);
                      }
                    }}
                    className="px-5 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Start Over
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-20 pointer-events-none">
        <div className="pointer-events-auto">
          {needsMic && (
            <AudioWaveform
              levels={audioLevels.levels}
              progress={displayProgress}
            />
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {prompter.pages.length > 1 && prompter.currentPageIndex > 0 && (
            <button
              onClick={handlePrevPage}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Previous page"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 3L5 7l4 4" />
              </svg>
            </button>
          )}
          {hasNextPage && (
            <button
              onClick={handleNextPage}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Next page"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3l4 4-4 4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {settings.listening_mode === 'wordTracking' &&
        speech.isListening &&
        prompter.lastSpokenText && (
          <div className="absolute bottom-14 left-4 z-20 max-w-md">
            <div className="text-xs text-white/30 truncate">
              {prompter.lastSpokenText.split(' ').slice(-8).join(' ')}
            </div>
          </div>
        )}

      {speech.error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300 max-w-md text-center">
          {speech.error}
        </div>
      )}

      {showPagePicker && (
        <PagePicker
          pages={prompter.pages}
          currentIndex={prompter.currentPageIndex}
          onSelect={handlePageSelect}
          onClose={() => setShowPagePicker(false)}
        />
      )}
    </div>
  );
}
