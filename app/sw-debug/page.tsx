'use client'
import { useEffect, useState } from 'react'

export default function SWDebug() {
  const [info, setInfo] = useState<string[]>([])
  
  const add = (msg: string) => 
    setInfo(prev => [...prev, msg])
  
  useEffect(() => {
    const run = async () => {
      add('SW in navigator: ' + ('serviceWorker' in navigator))
      add('Location: ' + window.location.href)
      add('Display mode standalone: ' + 
        window.matchMedia('(display-mode: standalone)').matches)
      
      const regs = await navigator.serviceWorker.getRegistrations()
      add('Registrations: ' + regs.length)
      regs.forEach((r, i) => {
        add(`Reg ${i}: scope=${r.scope} active=${r.active?.state} installing=${r.installing?.state}`)
      })
      
      try {
        const reg = await navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
        add('Register result: scope=' + reg.scope)
        add('After register active: ' + reg.active?.state)
        add('After register installing: ' + reg.installing?.state)
        
        setTimeout(async () => {
          const regs2 = await navigator.serviceWorker.getRegistrations()
          add('Regs after 3s: ' + regs2.length)
          regs2.forEach((r, i) => {
            add(`Reg ${i}: active=${r.active?.state}`)
          })
        }, 3000)
      } catch(e: any) {
        add('Register error: ' + e.message)
      }
    }
    run()
  }, [])
  
  return (
    <div style={{padding: 20, fontFamily: 'monospace', fontSize: 12}}>
      <h2>SW Debug</h2>
      {info.map((line, i) => (
        <div key={i} style={{marginBottom: 4, 
          color: line.includes('Error') ? 'red' : 'inherit'}}>
          {line}
        </div>
      ))}
    </div>
  )
}
