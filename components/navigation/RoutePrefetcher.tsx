'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PREFETCH_ROUTES = ['/dashboard', '/evening', '/morning', '/settings']

export default function RoutePrefetcher() {
  const router = useRouter()

  useEffect(() => {
    for (const route of PREFETCH_ROUTES) {
      router.prefetch(route)
    }
  }, [router])

  return null
}
