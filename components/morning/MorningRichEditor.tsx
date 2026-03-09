'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Italic from '@tiptap/extension-italic'
import History from '@tiptap/extension-history'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

type Props = {
  draftKey: string | null
  onFirstKey: () => void
  onChange: (text: string, json: Record<string, unknown>) => void
}

export default function MorningRichEditor({ draftKey, onFirstKey, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Italic,
      History,
      Placeholder.configure({
        placeholder: 'I was somewhere...',
      }),
    ],
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editorProps: {
      attributes: {
        style: 'min-height: 280px; color: #f6f2ff; outline: none; line-height: 1.7; white-space: pre-wrap;',
      },
      handleDOMEvents: {
        keydown: () => {
          onFirstKey()
          return false
        },
      },
    },
    onUpdate({ editor: current }) {
      const text = current.getText().trim()
      onChange(text, current.getJSON() as Record<string, unknown>)
    },
  })

  useEffect(() => {
    if (!editor || !draftKey) return

    const stored = localStorage.getItem(draftKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { body_json?: Record<string, unknown> }
        if (parsed.body_json) {
          editor.commands.setContent(parsed.body_json)
        }
      } catch {
        // Ignore malformed local drafts.
      }
    }

    const autosave = window.setInterval(() => {
      const json = editor.getJSON() as Record<string, unknown>
      localStorage.setItem(draftKey, JSON.stringify({ body_json: json }))
    }, 5000)

    return () => window.clearInterval(autosave)
  }, [draftKey, editor])

  return <EditorContent editor={editor} />
}
