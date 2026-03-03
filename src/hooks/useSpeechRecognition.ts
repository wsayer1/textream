import { useRef, useCallback, useEffect, useState } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface UseSpeechRecognitionOptions {
  locale: string;
  onResult: (transcript: string) => void;
}

export function useSpeechRecognition({
  locale,
  onResult,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const intentionalStopRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported =
    typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported) {
      setError(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    intentionalStopRef.current = false;
    retryCountRef.current = 0;
    setError(null);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      retryCountRef.current = 0;
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResultRef.current(transcript);
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        setError(
          'Microphone access denied. Please allow microphone access in your browser settings.'
        );
        setIsListening(false);
        return;
      }
      console.warn('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (intentionalStopRef.current) {
        setIsListening(false);
        return;
      }
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.min(retryCountRef.current * 300, 1500);
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        }, delay);
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setError('Failed to start speech recognition.');
    }
  }, [isSupported, locale]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, error, start, stop, isSupported };
}
