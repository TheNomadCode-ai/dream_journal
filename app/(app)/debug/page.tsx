'use client'

import { useEffect, useState } from 'react'

import { getAllDreams, getAllSeeds, type DreamEntry, type SeedEntry } from '@/lib/local-db'

export default function DebugPage() {
  const [dreams, setDreams] = useState<DreamEntry[]>([])
  const [seeds, setSeeds] = useState<SeedEntry[]>([])

  useEffect(() => {
    getAllDreams().then(setDreams)
    getAllSeeds().then(setSeeds)
  }, [])

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: 'white',
        background: '#06040f',
        minHeight: '100vh',
      }}
    >
      <h2>Seeds ({seeds.length})</h2>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          color: 'rgba(200,160,80,0.9)',
        }}
      >
        {JSON.stringify(seeds, null, 2)}
      </pre>

      <h2>Dreams ({dreams.length})</h2>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          color: 'rgba(100,220,150,0.9)',
        }}
      >
        {JSON.stringify(dreams, null, 2)}
      </pre>
    </div>
  )
}
