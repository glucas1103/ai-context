'use client';

import React, { useState } from 'react';

interface CreateModalState {
  isOpen: boolean;
  type: 'folder' | 'file' | null;
  parentId?: string;
}

interface DocumentationModalsProps {
  createModal: CreateModalState;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  onCreateFile: (name: string, parentId?: string) => Promise<void>;
  onClose: () => void;
}

export default function DocumentationModals({
  createModal,
  onCreateFolder,
  onCreateFile,
  onClose,
}: DocumentationModalsProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (createModal.type === 'folder') {
        await onCreateFolder(name.trim(), createModal.parentId);
      } else if (createModal.type === 'file') {
        await onCreateFile(name.trim(), createModal.parentId);
      }
    } finally {
      setIsSubmitting(false);
      setName('');
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
  };

  if (!createModal.isOpen) return null;

  const isFolder = createModal.type === 'folder';
  const title = isFolder ? 'Nouveau Dossier' : 'Nouveau Fichier';
  const placeholder = isFolder ? 'Nom du dossier...' : 'Nom du fichier (sans extension)...';
  const icon = isFolder ? '📁' : '📄';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Nom
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              disabled={isSubmitting}
            />
            {!isFolder && (
              <p className="text-xs text-gray-400 mt-1">
                L'extension .md sera automatiquement ajoutée
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? 'Création...' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
