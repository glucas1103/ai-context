import React from 'react';

interface TreeOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  status: 'pending' | 'success' | 'error';
  timestamp: number;
}

interface TreeStatusIndicatorProps {
  pendingOperations: TreeOperation[];
  isSyncing: boolean;
  hasPendingChanges: boolean;
  onForceSync?: () => void;
}

const TreeStatusIndicator: React.FC<TreeStatusIndicatorProps> = ({
  pendingOperations,
  isSyncing,
  hasPendingChanges,
  onForceSync
}) => {
  const pendingCount = pendingOperations.filter(op => op.status === 'pending').length;
  const errorCount = pendingOperations.filter(op => op.status === 'error').length;
  const successCount = pendingOperations.filter(op => op.status === 'success').length;

  if (!hasPendingChanges && !isSyncing) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      {/* Indicateur de synchronisation */}
      {isSyncing && (
        <div className="flex items-center space-x-1 text-blue-400">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
          <span>Sync...</span>
        </div>
      )}

      {/* Opérations en attente */}
      {pendingCount > 0 && (
        <div className="flex items-center space-x-1 text-yellow-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span>{pendingCount} en cours</span>
        </div>
      )}

      {/* Opérations réussies */}
      {successCount > 0 && (
        <div className="flex items-center space-x-1 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>{successCount} ✓</span>
        </div>
      )}

      {/* Erreurs */}
      {errorCount > 0 && (
        <div className="flex items-center space-x-1 text-red-400">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span>{errorCount} ✗</span>
        </div>
      )}

      {/* Bouton de synchronisation forcée */}
      {hasPendingChanges && onForceSync && (
        <button
          onClick={onForceSync}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="Forcer la synchronisation"
        >
          🔄
        </button>
      )}
    </div>
  );
};

export default TreeStatusIndicator;
