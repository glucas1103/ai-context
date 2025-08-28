// Mock pour react-syntax-highlighter
import React from 'react';

export const Prism = {
  SyntaxHighlighter: ({ children }: { children: React.ReactNode }) => {
    return <pre data-testid="syntax-highlighter">{children}</pre>;
  }
};

export const oneDark = {};

