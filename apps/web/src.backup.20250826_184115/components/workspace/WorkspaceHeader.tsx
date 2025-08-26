import React from 'react';

interface WorkspaceHeaderProps {
  workspace: {
    id: string;
    name: string;
    description?: string;
  };
  onBack?: () => void;
}

export function WorkspaceHeader({ workspace, onBack }: WorkspaceHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-sm text-gray-600">{workspace.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">ID: {workspace.id}</span>
      </div>
    </div>
  );
}
