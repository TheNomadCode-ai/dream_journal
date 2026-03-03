import type {
  CreateDreamInput,
  Dream,
  DreamListResponse,
  DreamSearchResponse,
  UpdateDreamInput,
} from '@/types/dream'

const BASE = '/api/dreams'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function listDreams(page = 1): Promise<DreamListResponse> {
  const res = await fetch(`${BASE}?page=${page}`, { cache: 'no-store' })
  return handleResponse<DreamListResponse>(res)
}

export async function getDream(id: string): Promise<Dream> {
  const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' })
  return handleResponse<Dream>(res)
}

export async function createDream(input: CreateDreamInput): Promise<Dream> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<Dream>(res)
}

export async function updateDream(id: string, input: UpdateDreamInput): Promise<Dream> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<Dream>(res)
}

export async function deleteDream(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  return handleResponse<void>(res)
}

export async function searchDreams(
  query: string,
  page = 1,
  perPage: 10 | 20 | 50 = 20
): Promise<DreamSearchResponse> {
  const params = new URLSearchParams({ q: query, page: String(page), per_page: String(perPage) })
  const res = await fetch(`${BASE}/search?${params}`, { cache: 'no-store' })
  return handleResponse<DreamSearchResponse>(res)
}
