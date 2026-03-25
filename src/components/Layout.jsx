import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

const Layout = ({ children, sessions, onSelectSession, onDeleteSession, activeSessionId }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header />

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-primary hover:bg-accent rounded-md flex items-center space-x-2 transition-colors"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="text-sm font-medium">{sidebarOpen ? 'Close Menu' : 'Menu'}</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-shrink-0 border-r border-border h-full">
          <Sidebar
            sessions={sessions}
            onSelectSession={onSelectSession}
            onDeleteSession={onDeleteSession}
            activeSessionId={activeSessionId}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden top-[73px] sm:top-[81px]"> {/* Adjust top to avoid header */}
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card shadow-xl transform transition-transform duration-300 ease-in-out">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  {/* Logo or Title could go here if needed in mobile menu */}
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  <Sidebar
                    sessions={sessions}
                    onSelectSession={(session) => {
                      onSelectSession(session);
                      setSidebarOpen(false);
                    }}
                    onDeleteSession={onDeleteSession}
                    activeSessionId={activeSessionId}
                  />
                </nav>
              </div>
            </div>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Force sidebar to shrink to fit close icon */}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-y-auto bg-background/50 focus:outline-none h-full">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
