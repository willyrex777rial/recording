import { useState, useRef, useCallback, useEffect } from 'react';

// Format seconds into [MM:SS] or [HH:MM:SS]
export const formatTimestamp = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `[${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}]`;
  }
  return `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}]`;
};

export const useWebSocketTranscription = (getDuration) => {
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Idle');

  const wsRef = useRef(null);
  const segmentsRef = useRef([]); // To keep track of transcript pieces and timestamps

  // Keep duration getter in a ref so we don't need to re-initialize SpeechRecognition when duration changes
  const getDurationRef = useRef(getDuration);
  useEffect(() => {
    getDurationRef.current = getDuration;
  }, [getDuration]);

  const connect = useCallback(() => {
      setStatus('Connecting...');
      wsRef.current = new WebSocket('ws://localhost:8000/ws');
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = () => {
          console.log("WebSocket connected.");
          setStatus('Listening');
          setError(null);
      };

      wsRef.current.onmessage = (event) => {
          try {
              const data = JSON.parse(event.data);

              if (data.status === 'keepalive') {
                  // Connection is alive, waiting for more audio
                  setStatus('Listening');
              } else if (data.status === 'success') {
                  if (!data.text) {
                      // Processed audio but no speech detected
                      setStatus('Listening');
                      return;
                  }
                  setStatus('Transcribing');

                  const currentTime = getDurationRef.current ? getDurationRef.current() : 0;
                  const formattedTimestamp = formatTimestamp(currentTime);

                  // Clean up the text
                  let cleanedText = data.text.trim();
                  if (!cleanedText) return;

                  const newSegment = {
                      text: cleanedText,
                      timestamp: formattedTimestamp,
                      time: currentTime
                  };

                  segmentsRef.current.push(newSegment);

                  // Rebuild full transcript
                  const fullTranscript = segmentsRef.current.map((seg, idx) => {
                       // Add paragraph breaks if the gap between sentences is > 2 seconds
                       if (idx === 0 || (seg.time - segmentsRef.current[idx-1].time) > 2) {
                           return `\n\n${seg.timestamp} ${seg.text}`;
                       } else {
                           return ` ${seg.text}`;
                       }
                  }).join('').trim();

                  setTranscript(fullTranscript);

                  // Revert status to listening after a beat
                  setTimeout(() => setStatus('Listening'), 500);
              } else if (data.status === 'error') {
                  console.error("Transcription error from server:", data.message);
                  setError(`Server error: ${data.message}`);
              }
          } catch (e) {
              console.error("Error parsing websocket message:", e);
          }
      };

      wsRef.current.onclose = () => {
          console.log("WebSocket closed.");
          if (status !== 'Idle') {
              setStatus('Idle');
          }
      };

      wsRef.current.onerror = (err) => {
          console.error("WebSocket error:", err);
          setError("Failed to connect to transcription server.");
          setStatus('Error');
      };
  }, []);

  const disconnect = useCallback(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
      }
      setStatus('Idle');
  }, []);

  const sendAudioChunk = useCallback((blob) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(blob);
      }
  }, []);

  const startListening = useCallback(() => {
      setTranscript('');
      segmentsRef.current = [];
      connect();
  }, [connect]);

  const stopListening = useCallback(() => {
      disconnect();
  }, [disconnect]);

  const pauseListening = useCallback(() => {
      // For websockets, we don't necessarily need to drop the connection, just stop sending chunks
      setStatus('Paused');
  }, []);

  const resumeListening = useCallback(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
      } else {
          setStatus('Listening');
      }
  }, [connect]);

  return {
    transcript,
    interimTranscript: '', // Whisper doesn't do word-by-word interim well in this basic setup
    isListening: status === 'Listening' || status === 'Transcribing',
    status,
    isSupported,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    sendAudioChunk,
    setTranscript // Helper for loading past sessions or manual editing
  };
};
