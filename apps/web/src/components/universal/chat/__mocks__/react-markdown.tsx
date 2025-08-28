// Mock pour react-markdown
import React from 'react';

const ReactMarkdown = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="markdown-content">{children}</div>;
};

export default ReactMarkdown;

