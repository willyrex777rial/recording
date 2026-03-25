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

export const useSpeechRecognition = (getDuration) => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const segmentsRef = useRef([]); // To keep track of transcript pieces and timestamps
  const lastActivityRef = useRef(Date.now());
  const silenceTimeoutRef = useRef(null);

  const SILENCE_THRESHOLD = 2000; // 2 seconds of silence = new paragraph/segment

  // Keep duration getter in a ref so we don't need to re-initialize SpeechRecognition when duration changes
  const getDurationRef = useRef(getDuration);
  useEffect(() => {
    getDurationRef.current = getDuration;
  }, [getDuration]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      lastActivityRef.current = Date.now();
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interimStr);

      if (finalStr) {
        const currentTime = getDurationRef.current ? getDurationRef.current() : 0;

        // Trim final string to remove leading spaces often returned by API
        const cleanedFinalStr = finalStr.trim();

        // Add timestamp if we don't have recent segments or it's a new burst
        const formattedTimestamp = formatTimestamp(currentTime);
        const newSegment = {
            text: cleanedFinalStr,
            timestamp: formattedTimestamp,
            time: currentTime
        };

        segmentsRef.current.push(newSegment);

        // Rebuild full transcript
        const fullTranscript = segmentsRef.current.map((seg, idx) => {
             // Add paragraph breaks based on logic, or just simple concatenation
             // For simplicity, we prepend the timestamp to the new sentence/segment
             if (idx === 0 || (seg.time - segmentsRef.current[idx-1].time) > 2) {
                 return `\n\n${seg.timestamp} ${seg.text}`;
             } else {
                 return ` ${seg.text}`;
             }
        }).join('').trim();

        setTranscript(fullTranscript);

        // Reset silence timer
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
            // Silence detected
            // Next final result will get a new paragraph/timestamp due to the time gap
        }, SILENCE_THRESHOLD);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Ignore no-speech errors, just means silence
        return;
      }
      console.error("SpeechRecognition error:", event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if we are supposed to be listening
      // This helps with continuous recognition dropping out
      if (isListening) {
         try {
             recognition.start();
         } catch(e) {
             // Already started or other error
             setIsListening(false);
         }
      } else {
          setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening]); // Remove getDuration from dependencies

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    try {
      setTranscript('');
      setInterimTranscript('');
      segmentsRef.current = [];
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start listening:", err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    try {
      setIsListening(false); // Update state first to prevent auto-restart in onend
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Failed to stop listening:", err);
    }
  }, [isSupported]);

  const pauseListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    try {
      setIsListening(false); // Update state first to prevent auto-restart in onend
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Failed to pause listening:", err);
    }
  }, [isSupported]);

  const resumeListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to resume listening:", err);
    }
  }, [isSupported]);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    setTranscript // Helper for loading past sessions or manual editing
  };
};
