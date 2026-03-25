import React from 'react';
import { FileAudio, Trash2 } from 'lucide-react';

const Sidebar = ({ sessions, onSelectSession, onDeleteSession, activeSessionId }) => {
  return (
    <aside className="w-full md:w-64 bg-card border-r border-border h-full flex flex-col overflow-y-auto shadow-sm md:shadow-none z-0">
      <div className="p-4 border-b border-border bg-muted/50">
        <h2 className="text-lg font-semibold text-foreground">Past Sessions</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center italic">No past sessions found.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'hover:bg-accent text-foreground border-l-4 border-transparent'
              }`}
            >
              <div
                className="flex-1 flex items-center space-x-3 overflow-hidden"
                onClick={() => onSelectSession(session)}
              >
                <FileAudio className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{session.name || 'Untitled Session'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-2"
                aria-label="Delete Session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
