import React from 'react';
import { FileText, Clock, Type } from 'lucide-react';

const Stats = ({ transcript }) => {
  // Simple word count
  const wordCount = transcript.trim() === '' ? 0 : transcript.trim().split(/\s+/).length;

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg shadow-sm text-sm text-muted-foreground mt-4 mb-2">
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">Session Statistics</span>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1.5 bg-secondary px-3 py-1.5 rounded-full">
          <Type className="h-4 w-4" />
          <span><strong className="text-foreground">{wordCount}</strong> words</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-secondary px-3 py-1.5 rounded-full">
          <Clock className="h-4 w-4" />
          <span><strong className="text-foreground">{readingTimeMinutes}</strong> min read</span>
        </div>
      </div>
    </div>
  );
};

export default Stats;
