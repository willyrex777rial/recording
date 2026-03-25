import { useState, useRef, useCallback, useEffect } from 'react';

const CHUNK_INTERVAL = 5000; // Generate chunks every 5s

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // in seconds
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [visualizerData, setVisualizerData] = useState(new Uint8Array(0));

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Audio Context for Visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setIsPaused(false);
        setDuration(0);
        audioChunksRef.current = [];

        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

        const updateVisualizer = () => {
          if (!analyserRef.current) return;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          setVisualizerData(dataArray);
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();
      };

      mediaRecorder.onpause = () => {
        setIsPaused(true);
        clearInterval(timerRef.current);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.onresume = () => {
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

        const updateVisualizer = () => {
          if (!analyserRef.current) return;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          setVisualizerData(dataArray);
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        setIsPaused(false);
        clearInterval(timerRef.current);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
           audioContextRef.current.close();
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(CHUNK_INTERVAL); // Save chunks frequently
      setError(null);
    } catch (err) {
      console.error("Microphone permission denied or error:", err);
      setError("Microphone access denied. Please allow microphone access to record.");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    audioURL,
    audioBlob,
    error,
    visualizerData,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setAudioURL, // Helper to clear or restore loaded
    setAudioBlob,
    setDuration, // Helper for loading past sessions
  };
};
