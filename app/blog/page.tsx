import type { Metadata } from 'next'
import Link from 'next/link'

import { getAllBlogPostsMeta, formatBlogDate } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'The Somnia Journal — Sleep Science & Dream Journaling',
  description:
    'Articles about dream journaling, sleep science, lucid dreaming, and the neuroscience of why we forget our dreams.',
  alternates: {
    canonical: 'https://somniavault.me/blog',
  },
}

export default async function BlogIndexPage() {
  const posts = await getAllBlogPostsMeta()

  return (
    <div className="blog-page-shell page-enter">
      <main className="blog-page-main">
        <header className="blog-index-header">
          <p className="blog-kicker">Journal</p>
          <h1 className="blog-index-title">The Somnia Journal</h1>
          <p className="blog-index-subtitle">
            Sleep science, dream journaling, and the art of remembering
          </p>
        </header>

        <section className="blog-index-list" aria-label="Blog posts">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              <Link href={`/blog/${post.slug}`} className="blog-card-title-link">
                <h2 className="blog-card-title">{post.title}</h2>
              </Link>
              <p className="blog-card-meta">
                {formatBlogDate(post.date)} · {post.readingTime}
              </p>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="blog-tag-pill">{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
