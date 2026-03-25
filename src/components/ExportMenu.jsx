import React, { useState } from 'react';
import { Download, Copy, FileText, File, Download as DownloadIcon } from 'lucide-react';
import { copyToClipboard, downloadTXT, downloadDOCX, downloadPDF } from '../utils/exportUtils';

const ExportMenu = ({ transcript, filenamePrefix = "Session" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(transcript);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    }
  };

  const handleExport = (type) => {
    const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}`;
    if (type === 'txt') downloadTXT(transcript, `${filename}.txt`);
    if (type === 'docx') downloadDOCX(transcript, `${filename}.docx`);
    if (type === 'pdf') downloadPDF(transcript, `${filename}.pdf`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-center w-full rounded-md border border-border shadow-sm px-4 py-2 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-colors"
        aria-haspopup="true"
        aria-expanded="true"
      >
        <DownloadIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
        Export
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border ring-1 ring-black ring-opacity-5 divide-y divide-border focus:outline-none z-50">
          <div className="py-1" role="none">
            <button
              onClick={handleCopy}
              className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              role="menuitem"
            >
              <Copy className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          <div className="py-1" role="none">
            <button
              onClick={() => handleExport('txt')}
              className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              role="menuitem"
            >
              <FileText className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              Download as .TXT
            </button>
            <button
              onClick={() => handleExport('docx')}
              className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              role="menuitem"
            >
              <File className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              Download as .DOCX
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              role="menuitem"
            >
              <FileText className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              Download as .PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
