import React, { useEffect } from 'react';
import { Play, Square, Pause, Mic } from 'lucide-react';

export const Timer = ({ duration }) => {
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = duration % 60;

  return (
    <div className="font-mono text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-wider text-primary">
      {h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}
      {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </div>
  );
};

const RecordingControls = ({
  isRecording,
  isPaused,
  duration,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled
}) => {
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        if (isRecording && !isPaused) {
          onPause();
        } else if (isRecording && isPaused) {
          onResume();
        } else if (!isRecording && !disabled) {
          onStart();
        }
      }

      if (e.code === 'Escape' && isRecording) {
        onStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isPaused, onStart, onPause, onResume, onStop, disabled]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto py-8">
      <Timer duration={duration} />

      <div className="flex items-center space-x-6">
        {!isRecording ? (
          <button
            onClick={onStart}
            disabled={disabled}
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center space-y-2 shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 ${
              disabled ? 'bg-muted cursor-not-allowed opacity-50' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            aria-label="Start Recording"
          >
            <Mic className="h-8 w-8 sm:h-12 sm:w-12" />
            <span className="text-sm sm:text-lg font-bold">RECORD</span>
          </button>
        ) : (
          <>
            <button
              onClick={isPaused ? onResume : onPause}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-md hover:bg-accent transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {isPaused ? <Play className="h-6 w-6 sm:h-8 sm:w-8" /> : <Pause className="h-6 w-6 sm:h-8 sm:w-8" />}
            </button>
            <button
              onClick={onStop}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-destructive text-destructive-foreground flex flex-col items-center justify-center space-y-1 shadow-lg hover:bg-destructive/90 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-destructive focus:ring-opacity-50"
              aria-label="Stop Recording"
            >
              <Square className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" />
              <span className="text-xs sm:text-sm font-bold">STOP</span>
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Shortcuts: <strong>Spacebar</strong> to {isRecording ? (isPaused ? 'Resume' : 'Pause') : 'Record'}, <strong>Esc</strong> to Stop.</p>
      </div>
    </div>
  );
};

export default RecordingControls;
