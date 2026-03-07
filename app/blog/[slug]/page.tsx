import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import ShareActions from '@/components/blog/ShareActions'
import { getAppUrl } from '@/lib/app-url'
import {
  formatBlogDate,
  getAllPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from '@/lib/blog'

type BlogPostPageProps = {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found | Somnia',
      description: 'The requested Somnia Journal post could not be found.',
    }
  }

  const canonicalUrl = `${getAppUrl()}/blog/${post.frontmatter.slug}`

  return {
    title: `${post.frontmatter.title} | The Somnia Journal`,
    description: post.frontmatter.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      url: canonicalUrl,
      type: 'article',
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const canonicalUrl = `${getAppUrl()}/blog/${post.frontmatter.slug}`
  const relatedPosts = await getRelatedBlogPosts(post.frontmatter.slug, post.frontmatter.tags, 2)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    author: {
      '@type': 'Organization',
      name: 'Somnia Team',
    },
    datePublished: post.frontmatter.date,
    dateModified: post.frontmatter.date,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
  }

  return (
    <div className="blog-page-shell">
      <main className="blog-post-main">
        <header className="blog-post-header">
          <p className="blog-kicker">The Somnia Journal</p>
          <h1 className="blog-post-title">{post.frontmatter.title}</h1>
          <p className="blog-post-meta">
            {formatBlogDate(post.frontmatter.date)} · {post.frontmatter.readingTime} · Somnia Team
          </p>
          <p className="blog-post-excerpt">{post.frontmatter.excerpt}</p>
          <div className="blog-card-tags">
            {post.frontmatter.tags.map((tag) => (
              <span key={tag} className="blog-tag-pill">{tag}</span>
            ))}
          </div>
        </header>

        <article className="blog-post-content">
          <MDXRemote
            source={post.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </article>

        <section className="blog-share-section" aria-label="Share this article">
          <h2 className="blog-section-title">Share this post</h2>
          <ShareActions title={post.frontmatter.title} url={canonicalUrl} />
        </section>

        <section className="blog-related-section" aria-label="Related posts">
          <h2 className="blog-section-title">Related posts</h2>
          <div className="blog-related-grid">
            {relatedPosts.map((related) => (
              <article key={related.slug} className="blog-card">
                <Link href={`/blog/${related.slug}`} className="blog-card-title-link">
                  <h3 className="blog-card-title">{related.title}</h3>
                </Link>
                <p className="blog-card-meta">
                  {formatBlogDate(related.date)} · {related.readingTime}
                </p>
                <p className="blog-card-excerpt">{related.excerpt}</p>
              </article>
            ))}
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      </main>
    </div>
  )
}
