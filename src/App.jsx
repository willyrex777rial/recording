import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import RecordingControls from './components/RecordingControls';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import Stats from './components/Stats';
import ExportMenu from './components/ExportMenu';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useWebSocketTranscription } from './hooks/useWebSocketTranscription';
import { saveSession, getAllSessions, deleteSession } from './utils/storage';
import { AlertCircle, Edit2, Check } from 'lucide-react';

function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionName, setSessionName] = useState('New Session');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showConfirmStop, setShowConfirmStop] = useState(false);
  const nameInputRef = useRef(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const loadedSessions = await getAllSessions();
    setSessions(loadedSessions);
  };

  const {
    transcript,
    interimTranscript,
    status,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    sendAudioChunk,
    setTranscript
  } = useWebSocketTranscription(useCallback(() => {
     // A slightly messy way to grab duration on the fly, but works for the ref
     const el = document.getElementById('duration-ref');
     return el ? parseInt(el.getAttribute('data-duration') || '0', 10) : 0;
  }, []));

  const handleAudioChunk = useCallback((blob) => {
      // Send the audio blob to the websocket server
      if (status !== 'Paused' && status !== 'Error' && status !== 'Idle') {
          sendAudioChunk(blob);
      }
  }, [status, sendAudioChunk]);

  const {
    isRecording,
    isPaused,
    duration,
    audioURL,
    audioBlob,
    error: audioError,
    visualizerData,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setAudioURL,
    setAudioBlob,
    setDuration
  } = useAudioRecorder(handleAudioChunk);

  // Sync Audio and Speech states
  const handleStart = useCallback(() => {
    startRecording();
    startListening();
    setActiveSession(null); // Clear past session
    setSessionName(`Session ${new Date().toLocaleDateString()}`);
  }, [startRecording, startListening]);

  const handlePause = useCallback(() => {
    pauseRecording();
    pauseListening();
  }, [pauseRecording, pauseListening]);

  const handleResume = useCallback(() => {
    resumeRecording();
    resumeListening();
  }, [resumeRecording, resumeListening]);

  const handleRequestStop = useCallback(() => {
    if (duration > 300) { // Ask for confirmation if longer than 5 mins
      setShowConfirmStop(true);
    } else {
      handleStop();
    }
  }, [duration]);

  const handleStop = useCallback(async () => {
    stopRecording();
    stopListening();
    setShowConfirmStop(false);
  }, [stopRecording, stopListening]);

  // Keep track of previous recording state to detect when it stops
  const wasRecordingRef = useRef(false);

  // Handle saving when recording finishes
  useEffect(() => {
    const saveCompletedSession = async () => {
      const justStopped = wasRecordingRef.current && !isRecording;

      // ONLY trigger save if we JUST transitioned from recording to NOT recording
      // And we have some data
      if (justStopped && audioBlob && transcript && duration > 0) {
        try {
          // Convert Blob to ArrayBuffer for storage
          const arrayBuffer = await audioBlob.arrayBuffer();
          const newSession = {
            // Include activeSession id if we somehow are updating, but usually this is null for new recording
            ...(activeSession ? { id: activeSession.id } : {}),
            name: sessionName,
            transcript,
            duration,
            audioData: arrayBuffer,
            mimeType: audioBlob.type
          };

          const saved = await saveSession(newSession);
          setActiveSession(saved);
          loadSessions();
        } catch (error) {
          console.error("Failed to save session:", error);
          alert("Failed to save session locally.");
        }
      }

      wasRecordingRef.current = isRecording;
    };

    saveCompletedSession();
  }, [isRecording, audioBlob, transcript, duration, sessionName, activeSession]);

  const handleSelectSession = useCallback(async (session) => {
    if (isRecording) {
      alert("Please stop recording before viewing a past session.");
      return;
    }
    setActiveSession(session);
    setSessionName(session.name);
    setTranscript(session.transcript);
    setDuration(session.duration);

    if (session.audioData) {
      const blob = new Blob([session.audioData], { type: session.mimeType || 'audio/webm' });
      setAudioBlob(blob);
      setAudioURL(URL.createObjectURL(blob));
    } else {
      setAudioBlob(null);
      setAudioURL(null);
    }
  }, [isRecording, setTranscript, setDuration, setAudioBlob, setAudioURL]);

  const handleDeleteSession = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      await deleteSession(id);
      if (activeSession && activeSession.id === id) {
        // Clear current view
        setActiveSession(null);
        setTranscript('');
        setDuration(0);
        setAudioURL(null);
        setAudioBlob(null);
        setSessionName('New Session');
      }
      loadSessions();
    }
  }, [activeSession, setTranscript, setDuration, setAudioURL, setAudioBlob]);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 10);
  };

  const handleNameSave = async () => {
    setIsEditingName(false);
    if (activeSession) {
      const updatedSession = { ...activeSession, name: sessionName };
      await saveSession(updatedSession);
      setActiveSession(updatedSession);
      loadSessions();
    }
  };

  // Manual Transcript Edit
  const handleTranscriptChange = async (newText) => {
     setTranscript(newText);
     if (activeSession && !isRecording) {
         const updatedSession = { ...activeSession, transcript: newText };
         await saveSession(updatedSession);
         setActiveSession(updatedSession);
         loadSessions(); // Update list silently
     }
  };

  // Fallbacks
  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md p-6 bg-card border border-destructive rounded-lg shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Browser Not Supported</h2>
          <p className="text-muted-foreground">
            VoiceLog Pro requires WebSockets for live transcription.
            Please use a modern browser for the best experience.
          </p>
        </div>
      </div>
    );
  }

  const hasError = audioError || speechError;

  return (
    <Layout
      sessions={sessions}
      onSelectSession={handleSelectSession}
      onDeleteSession={handleDeleteSession}
      activeSessionId={activeSession?.id}
    >
      {/* Session Header */}
      <div id="duration-ref" data-duration={duration} className="hidden" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-2">
          {isEditingName ? (
             <div className="flex items-center space-x-2">
                 <input
                    ref={nameInputRef}
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none text-foreground w-full max-w-xs"
                 />
                 <button onClick={handleNameSave} className="p-1 text-primary hover:bg-primary/10 rounded">
                    <Check className="h-5 w-5" />
                 </button>
             </div>
          ) : (
            <div className="flex items-center space-x-2 group cursor-pointer" onClick={handleNameEdit}>
              <h2 className="text-2xl font-bold text-foreground truncate max-w-[200px] sm:max-w-md" title={sessionName}>{sessionName}</h2>
              <Edit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}

          {isRecording && <span className="flex h-3 w-3 relative ml-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>}
        </div>

        {/* Export / Playback area */}
        <div className="flex items-center justify-end space-x-4">
           {audioURL && !isRecording && (
              <audio controls src={audioURL} className="h-10 w-full max-w-[200px]" />
           )}
           {(!isRecording && (transcript || activeSession)) && (
              <ExportMenu transcript={transcript} filenamePrefix={sessionName} />
           )}
        </div>
      </div>

      {hasError && (
        <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive text-destructive rounded-r-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{audioError || speechError}</p>
        </div>
      )}

      {/* Main Content Areas */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Left Column: Controls & Visualizer */}
        <div className="flex flex-col w-full lg:w-1/3 xl:w-1/4 space-y-6 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              duration={duration}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleRequestStop}
              disabled={!!activeSession && !isRecording} // Disable new recording while viewing past, must click "New" theoretically
            />
          </div>

          <Visualizer isRecording={isRecording && !isPaused} visualizerData={visualizerData} />

          {/* New Session Button Helper */}
          {!isRecording && (activeSession || transcript) && (
            <button
               onClick={() => {
                  setActiveSession(null);
                  setTranscript('');
                  setDuration(0);
                  setAudioURL(null);
                  setAudioBlob(null);
                  setSessionName('New Session');
               }}
               className="w-full py-3 px-4 bg-secondary text-secondary-foreground hover:bg-accent rounded-lg font-medium transition-colors border border-border shadow-sm"
            >
               Start New Session
            </button>
          )}
        </div>

        {/* Right Column: Transcript */}
        <div className="flex flex-col flex-1 w-full min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-foreground">Transcript</h3>
              {isRecording && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  status === 'Transcribing' ? 'bg-primary/20 text-primary animate-pulse' :
                  status === 'Listening' ? 'bg-secondary text-secondary-foreground' :
                  status === 'Error' ? 'bg-destructive/20 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {status}
                </span>
              )}
            </div>
            {!isRecording && transcript && (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Editable</span>
            )}
          </div>

          <Transcript
            transcript={transcript}
            interimTranscript={interimTranscript}
            isRecording={isRecording}
            isEditable={!isRecording && transcript.length > 0}
            onTranscriptChange={handleTranscriptChange}
          />

          <Stats transcript={transcript} />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Stop Recording?</h3>
            <p className="text-muted-foreground mb-6">
              You've been recording for a long time. Are you sure you want to stop?
              The session will be finalized and saved automatically.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmStop(false)}
                className="px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 font-medium transition-colors"
              >
                Stop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
