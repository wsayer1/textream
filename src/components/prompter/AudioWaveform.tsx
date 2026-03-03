interface AudioWaveformProps {
  levels: number[];
  progress: number;
}

export default function AudioWaveform({ levels, progress }: AudioWaveformProps) {
  return (
    <div className="flex items-center gap-[2px] h-7">
      {levels.map((level, i) => {
        const barProgress = i / Math.max(1, levels.length - 1);
        const isLit = barProgress <= progress;
        return (
          <div
            key={i}
            className="rounded-sm transition-all duration-75"
            style={{
              width: 3,
              height: Math.max(3, level * 28),
              backgroundColor: isLit
                ? 'rgba(255, 214, 10, 0.9)'
                : 'rgba(255, 255, 255, 0.15)',
            }}
          />
        );
      })}
    </div>
  );
}
