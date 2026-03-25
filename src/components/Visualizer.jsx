import React, { useEffect, useRef } from 'react';

const Visualizer = ({ isRecording, visualizerData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!isRecording || !visualizerData || visualizerData.length === 0) {
      // Draw a flat line when not recording
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(15, 118, 110, 0.5)'; // Primary color with opacity
      ctx.stroke();
      return;
    }

    const bufferLength = visualizerData.length;
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    // Theming consideration: use primary color
    ctx.fillStyle = 'rgba(15, 118, 110, 0.8)'; // Teal-700
    // In dark mode, we might want a brighter color, but we'll use CSS to handle opacity if needed or rely on base color

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (visualizerData[i] / 255) * height;

      // Draw mirrored
      const y = height / 2 - barHeight / 2;

      ctx.fillRect(x, y, barWidth, barHeight);

      x += barWidth + 1;
    }
  }, [isRecording, visualizerData]);

  return (
    <div className="w-full h-24 bg-card border border-border rounded-lg overflow-hidden flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        width={300}
        height={80}
        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen"
      />
    </div>
  );
};

export default Visualizer;
