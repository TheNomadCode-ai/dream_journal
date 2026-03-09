const DB_NAME = 'somnia-dreams'
const DB_VERSION = 1

export interface DreamEntry {
  id: string
  date: string // YYYY-MM-DD
  content: string
  createdAt: number
}

export interface SeedEntry {
  id: string
  date: string // YYYY-MM-DD
  seedText: string
  wasDreamed: boolean | null
  morningEntryWritten: boolean
  createdAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('dreams')) {
        const dreams = db.createObjectStore('dreams', { keyPath: 'id' })
        dreams.createIndex('date', 'date', { unique: true })
      }

      if (!db.objectStoreNames.contains('seeds')) {
        const seeds = db.createObjectStore('seeds', { keyPath: 'id' })
        seeds.createIndex('date', 'date', { unique: true })
      }
    }

    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDream(dream: DreamEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('dreams', 'readwrite')
    tx.objectStore('dreams').put(dream)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getDreamByDate(date: string): Promise<DreamEntry | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('dreams', 'readonly')
    const req = tx.objectStore('dreams').index('date').get(date)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllDreams(): Promise<DreamEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('dreams', 'readonly')
    const req = tx.objectStore('dreams').getAll()
    req.onsuccess = () => {
      const rows = (req.result as DreamEntry[]).sort((a, b) => b.createdAt - a.createdAt)
      resolve(rows)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveSeed(seed: SeedEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('seeds', 'readwrite')
    tx.objectStore('seeds').put(seed)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSeedByDate(date: string): Promise<SeedEntry | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('seeds', 'readonly')
    const req = tx.objectStore('seeds').index('date').get(date)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllSeeds(): Promise<SeedEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('seeds', 'readonly')
    const req = tx.objectStore('seeds').getAll()
    req.onsuccess = () => {
      const rows = (req.result as SeedEntry[]).sort((a, b) => b.createdAt - a.createdAt)
      resolve(rows)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function updateSeed(date: string, updates: Partial<SeedEntry>): Promise<void> {
  const existing = await getSeedByDate(date)
  if (!existing) return
  await saveSeed({ ...existing, ...updates })
}

export async function getStats() {
  const dreams = await getAllDreams()
  const seeds = await getAllSeeds()

  const totalSeeds = seeds.length
  const dreamedSeeds = seeds.filter((s) => s.wasDreamed === true).length
  const successRate = totalSeeds > 0 ? Math.round((dreamedSeeds / totalSeeds) * 100) : 0

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const hasDream = dreams.some((dr) => dr.date === dateStr)
    if (hasDream) streak += 1
    else if (i > 0) break
  }

  return {
    totalDreams: dreams.length,
    totalSeeds,
    successRate,
    streak,
  }
}
