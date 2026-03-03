import { useRef, useState, useCallback, useEffect } from 'react';

const LEVEL_COUNT = 30;

export function useAudioLevels() {
  const [levels, setLevels] = useState<number[]>(
    () => new Array(LEVEL_COUNT).fill(0)
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const externalStreamRef = useRef(false);
  const rafRef = useRef<number>(0);
  const levelsBuffer = useRef<number[]>(new Array(LEVEL_COUNT).fill(0));

  const startWithStream = useCallback((stream: MediaStream) => {
    externalStreamRef.current = true;
    streamRef.current = stream;
    startAnalyser(stream);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      externalStreamRef.current = false;
      streamRef.current = stream;
      startAnalyser(stream);
    } catch {
      console.warn('Could not access microphone for audio levels');
    }
  }, []);

  function startAnalyser(stream: MediaStream) {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length / 255;
      const level = Math.min(avg * 3, 1);

      const buf = levelsBuffer.current;
      buf.push(level);
      if (buf.length > LEVEL_COUNT) buf.shift();
      levelsBuffer.current = buf;

      setLevels([...buf]);

      const recent = buf.slice(-10);
      const recentAvg =
        recent.reduce((a, b) => a + b, 0) / recent.length;
      setIsSpeaking(recentAvg > 0.08);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (!externalStreamRef.current && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    externalStreamRef.current = false;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    levelsBuffer.current = new Array(LEVEL_COUNT).fill(0);
    setLevels(new Array(LEVEL_COUNT).fill(0));
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (!externalStreamRef.current && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { levels, isSpeaking, start, startWithStream, stop };
}
