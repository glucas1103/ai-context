'use client';

import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface ThreePanelsLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  config?: {
    defaultSizes?: [number, number, number]; // ex: [25, 50, 25]
    minSizes?: [number, number, number];     // ex: [15, 30, 15] 
    maxSizes?: [number, number, number];     // ex: [40, 70, 40]
    persistKey?: string;                     // pour sauvegarde layout
  };
  className?: string;
}

const ThreePanelsLayout: React.FC<ThreePanelsLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  config = {},
  className = 'h-full'
}) => {
  const {
    defaultSizes = [25, 50, 25],
    minSizes = [15, 30, 15],
    maxSizes = [40, 70, 40],
    persistKey
  } = config;

  return (
    <div className={className}>
      <PanelGroup 
        direction="horizontal" 
        className="h-full"
        autoSaveId={persistKey}
      >
        {/* Left Panel */}
        <Panel 
          defaultSize={defaultSizes[0]} 
          minSize={minSizes[0]} 
          maxSize={maxSizes[0]}
        >
          {leftPanel}
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

        {/* Center Panel */}
        <Panel 
          defaultSize={defaultSizes[1]} 
          minSize={minSizes[1]}
          maxSize={maxSizes[1]}
        >
          {centerPanel}
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

        {/* Right Panel */}
        <Panel 
          defaultSize={defaultSizes[2]} 
          minSize={minSizes[2]} 
          maxSize={maxSizes[2]}
        >
          {rightPanel}
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default ThreePanelsLayout;
