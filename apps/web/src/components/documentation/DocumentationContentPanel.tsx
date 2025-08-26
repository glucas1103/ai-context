'use client';

import React from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { DocumentationNode } from '@/lib/types/documentation';

interface DocumentationContentPanelProps {
  selectedFile: DocumentationNode | null;
  content: string;
  onChange: (content: string) => void;
  onAutoSave: (content: string) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
}

export default function DocumentationContentPanel({
  selectedFile,
  content,
  onChange,
  onAutoSave,
  isLoading = false,
  isSaving = false,
}: DocumentationContentPanelProps) {
  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header avec informations du fichier */}
      {selectedFile && (
        <div className="p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {selectedFile.name}
              </h3>
              <p className="text-sm text-gray-400">
                {selectedFile.path}
              </p>
            </div>
            {isSaving && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-sm">Sauvegarde...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenu du fichier */}
      <div className="flex-1">
        {selectedFile ? (
          selectedFile.type === 'file' ? (
            <RichTextEditor
              content={content}
              onChange={onChange}
              onAutoSave={onAutoSave}
              placeholder={`Commencez à écrire dans ${selectedFile.name}...`}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg">Dossier sélectionné</p>
                <p className="text-sm">
                  Sélectionnez un fichier pour l'éditer ou créez-en un nouveau.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg">Aucun fichier sélectionné</p>
              <p className="text-sm">
                Sélectionnez un fichier dans l'arborescence pour commencer à l'éditer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
