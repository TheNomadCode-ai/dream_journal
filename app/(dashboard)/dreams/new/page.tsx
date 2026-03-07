import { redirect } from 'next/navigation'

type DreamsNewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DreamsNewPage({ searchParams }: DreamsNewPageProps) {
  const params = await searchParams
  const target = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      target.set(key, value)
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((item) => target.append(key, item))
    }
  }

  const suffix = target.toString()
  redirect(suffix ? `/capture?${suffix}` : '/capture')
}
