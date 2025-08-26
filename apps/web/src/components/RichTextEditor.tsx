'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TipTapEditorProps } from '@/lib/types/documentation';

const RichTextEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onAutoSave,
  editable = true,
  placeholder = 'Commencez à écrire...',
  className = ''
}) => {
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure les extensions intégrées
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        link: false, // Désactiver le link du StarterKit pour utiliser notre config custom
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image
    ],
    content: content,
    editable: editable,
    immediatelyRender: false, // Important pour Next.js SSR
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange(newContent);

      // Auto-sauvegarde avec debouncing
      if (onAutoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          onAutoSave(newContent);
        }, 3000); // Auto-sauvegarde après 3 secondes d'inactivité
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] max-w-none dark:prose-invert ${className}`,
        'data-placeholder': placeholder
      }
    }
  });

  // Mettre à jour le contenu quand la prop change
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
        <div className="text-gray-400">Chargement de l'éditeur...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg">
      {editable && (
        <div className="flex flex-wrap gap-2 p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
          {/* Boutons de formatage */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive('bold')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Gras
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive('italic')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Italique
          </button>
          
          {/* Séparateur */}
          <div className="w-px bg-gray-600 mx-1"></div>
          
          {/* Titres */}
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level: level as any }).run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive('heading', { level })
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              H{level}
            </button>
          ))}
          
          {/* Séparateur */}
          <div className="w-px bg-gray-600 mx-1"></div>
          
          {/* Listes */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive('bulletList')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive('orderedList')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Numéroté
          </button>
          
          {/* Séparateur */}
          <div className="w-px bg-gray-600 mx-1"></div>
          
          {/* Citations et code */}
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive('blockquote')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Citation
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1 text-sm rounded ${
              editor.isActive('codeBlock')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Code
          </button>
        </div>
      )}
      
      <div className="p-4">
        <EditorContent 
          editor={editor} 
          className="focus:outline-none"
        />
      </div>

      {/* Style personnalisé pour le placeholder */}
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }
        
        .ProseMirror {
          color: #f3f4f6;
        }
        
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4,
        .ProseMirror h5,
        .ProseMirror h6 {
          color: #f9fafb;
        }
        
        .ProseMirror code {
          background-color: #374151;
          color: #f9fafb;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
        }
        
        .ProseMirror pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #d1d5db;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          color: #f3f4f6;
        }
        
        .ProseMirror a {
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
