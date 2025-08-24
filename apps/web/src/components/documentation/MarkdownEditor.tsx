'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Heading } from '@tiptap/extension-heading'
import { Bold, Italic } from '@tiptap/extension-bold'
import { ListItem, BulletList, OrderedList } from '@tiptap/extension-list-item'
import { Blockquote } from '@tiptap/extension-blockquote'
import { CodeBlock } from '@tiptap/extension-code-block'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { useEffect, useCallback } from 'react'
import { 
  HiBold, 
  HiItalic, 
  HiListBullet, 
  HiListNumber, 
  HiCode, 
  HiLink, 
  HiPhotograph,
  HiDocumentText
} from 'react-icons/hi'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function MarkdownEditor({
  content,
  onChange,
  onSave,
  placeholder = 'Commencez à écrire votre documentation...',
  disabled = false,
  className = ''
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6]
      }),
      Bold,
      Italic,
      ListItem,
      BulletList,
      OrderedList,
      Blockquote,
      CodeBlock,
      Link,
      Image
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 text-gray-200'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    }
  })

  // Mettre à jour le contenu quand la prop content change
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Désactiver l'éditeur si nécessaire
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  // Raccourcis clavier
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault()
          onSave?.()
          break
        case 'b':
          event.preventDefault()
          editor?.chain().focus().toggleBold().run()
          break
        case 'i':
          event.preventDefault()
          editor?.chain().focus().toggleItalic().run()
          break
      }
    }
  }, [editor, onSave])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!editor) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
        <div className="animate-pulse p-4">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-700 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Titre 1 (Ctrl+1)"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Titre 2 (Ctrl+2)"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Titre 3 (Ctrl+3)"
        >
          H3
        </button>
        
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Gras (Ctrl+B)"
        >
          <HiBold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Italique (Ctrl+I)"
        >
          <HiItalic className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Liste à puces"
        >
          <HiListBullet className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Liste numérotée"
        >
          <HiListNumber className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Citation"
        >
          <HiDocumentText className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('codeBlock') ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Bloc de code"
        >
          <HiCode className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        
        <button
          onClick={() => {
            const url = window.prompt('URL du lien:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`p-2 rounded hover:bg-gray-700 transition-colors ${
            editor.isActive('link') ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          title="Lien"
        >
          <HiLink className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            const url = window.prompt('URL de l\'image:')
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }}
          className="p-2 rounded hover:bg-gray-700 transition-colors text-gray-300"
          title="Image"
        >
          <HiPhotograph className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
        {!content && (
          <div className="absolute top-4 left-4 text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-700 p-2 text-xs text-gray-400 flex justify-between">
        <div>
          {editor.storage.characterCount.characters()} caractères
        </div>
        <div>
          Ctrl+S pour sauvegarder
        </div>
      </div>
    </div>
  )
}
