import { useRef, useCallback, useEffect, useState } from 'react';

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

interface DeepgramResponse {
  type: string;
  channel?: DeepgramChannel;
  is_final?: boolean;
  speech_final?: boolean;
}

export interface DeepgramResult {
  finalizedText: string;
  interimText: string;
}

interface UseDeepgramRecognitionOptions {
  apiKey: string;
  locale: string;
  onResult: (result: DeepgramResult) => void;
}

function mapLocaleToDeepgram(locale: string): string {
  const map: Record<string, string> = {
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'it-IT': 'it',
    'pt-BR': 'pt-BR',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'tr-TR': 'tr',
    'ru-RU': 'ru',
    'ar-SA': 'ar',
    'hi-IN': 'hi',
  };
  return map[locale] || locale;
}

export function useDeepgramRecognition({
  apiKey,
  locale,
  onResult,
}: UseDeepgramRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentionalStopRef = useRef(false);
  const retryCountRef = useRef(0);
  const finalizedTextRef = useRef('');
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const cleanup = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback((stream: MediaStream) => {
    const dgLocale = mapLocaleToDeepgram(localeRef.current);
    const params = new URLSearchParams({
      model: 'nova-3',
      language: dgLocale,
      smart_format: 'true',
      interim_results: 'true',
      punctuate: 'true',
      endpointing: '300',
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '1',
    });

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
    const ws = new WebSocket(url, ['token', apiKeyRef.current]);

    ws.onopen = () => {
      retryCountRef.current = 0;
      setIsListening(true);
      setError(null);
      startAudioCapture(stream, ws);

      keepAliveRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'KeepAlive' }));
        }
      }, 8000);
    };

    ws.onmessage = (event) => {
      try {
        const data: DeepgramResponse = JSON.parse(event.data);
        if (data.type !== 'Results' || !data.channel) return;

        const transcript = data.channel.alternatives[0]?.transcript || '';
        if (!transcript) return;

        if (data.is_final) {
          const sep = finalizedTextRef.current ? ' ' : '';
          finalizedTextRef.current += sep + transcript;
          onResultRef.current({
            finalizedText: finalizedTextRef.current,
            interimText: '',
          });
        } else {
          onResultRef.current({
            finalizedText: finalizedTextRef.current,
            interimText: transcript,
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      setError('Connection to Deepgram failed. Check your API key.');
    };

    ws.onclose = () => {
      if (intentionalStopRef.current) {
        setIsListening(false);
        return;
      }
      if (retryCountRef.current < 5) {
        retryCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 8000);
        setTimeout(() => {
          if (!intentionalStopRef.current && stream.active) {
            connectWebSocket(stream);
          }
        }, delay);
      } else {
        setIsListening(false);
        setError('Lost connection to Deepgram. Please restart.');
      }
    };

    wsRef.current = ws;
  }, []);

  function startAudioCapture(stream: MediaStream, ws: WebSocket) {
    const ctx = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      ws.send(pcm16.buffer);
    };

    source.connect(processor);
    processor.connect(ctx.destination);
    processorRef.current = processor;
  }

  const startWithStream = useCallback(
    (stream: MediaStream) => {
      if (!apiKeyRef.current) {
        setError('No Deepgram API key configured.');
        return;
      }
      intentionalStopRef.current = false;
      retryCountRef.current = 0;
      finalizedTextRef.current = '';
      setError(null);
      streamRef.current = stream;
      connectWebSocket(stream);
    },
    [connectWebSocket]
  );

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    cleanup();
    setIsListening(false);
  }, [cleanup]);

  const resetTranscript = useCallback(() => {
    finalizedTextRef.current = '';
  }, []);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return { isListening, error, startWithStream, stop, resetTranscript };
}
