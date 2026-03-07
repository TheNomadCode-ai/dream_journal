'use client'

import { useState } from 'react'

type ShareActionsProps = {
  title: string
  url: string
}

export default function ShareActions({ title, url }: ShareActionsProps) {
  const [copied, setCopied] = useState(false)

  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="blog-share-wrap">
      <a href={xShareUrl} target="_blank" rel="noopener noreferrer" className="blog-share-btn">
        Share on X
      </a>
      <button type="button" onClick={handleCopy} className="blog-share-btn">
        {copied ? 'Copied link' : 'Copy link'}
      </button>
    </div>
  )
}
