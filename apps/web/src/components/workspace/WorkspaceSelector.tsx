import React from 'react';

interface WorkspaceSelectorProps {
  workspaces: Array<{ id: string; name: string }>;
  selectedWorkspaceId?: string;
  onWorkspaceChange: (workspaceId: string) => void;
}

export function WorkspaceSelector({ 
  workspaces, 
  selectedWorkspaceId, 
  onWorkspaceChange 
}: WorkspaceSelectorProps) {
  return (
    <select 
      value={selectedWorkspaceId} 
      onChange={(e) => onWorkspaceChange(e.target.value)}
      className="px-3 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Sélectionner un workspace</option>
      {workspaces.map(workspace => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </select>
  );
}
