import React, { useEffect, useRef } from 'react';

const Transcript = ({ transcript, interimTranscript, isRecording, isEditable, onTranscriptChange }) => {
  const scrollRef = useRef(null);

  // Auto-scroll when recording
  useEffect(() => {
    if (isRecording && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript, isRecording]);

  const handleEdit = (e) => {
    onTranscriptChange(e.target.value);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card border border-border rounded-lg shadow-sm overflow-hidden transition-all duration-300 relative">
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        {isEditable ? (
          <textarea
            value={transcript}
            onChange={handleEdit}
            className="w-full h-full min-h-[300px] resize-none border-0 focus:ring-0 p-0 bg-transparent text-foreground placeholder:text-muted-foreground outline-none whitespace-pre-wrap leading-relaxed font-serif text-lg"
            placeholder="Start recording to see transcript..."
          />
        ) : (
          <div className="w-full h-full text-foreground whitespace-pre-wrap leading-relaxed font-serif text-lg">
            {transcript ? (
               // Simple syntax highlighting for timestamps
               <span dangerouslySetInnerHTML={{
                  __html: transcript.replace(/\[\d{2}:\d{2}(:\d{2})?\]/g, match => `<strong class="text-primary font-mono text-sm mr-2">${match}</strong>`)
               }} />
            ) : (
              <span className="text-muted-foreground italic">
                {isRecording ? "Listening..." : "Transcript will appear here..."}
              </span>
            )}

            {interimTranscript && (
              <span className="text-muted-foreground opacity-70 inline-block mt-2 transition-opacity duration-200 italic">
                 {interimTranscript}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transcript;
