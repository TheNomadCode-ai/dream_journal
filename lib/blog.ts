import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'

export type BlogFrontmatter = {
  title: string
  date: string
  excerpt: string
  metaDescription?: string
  slug: string
  readingTime: string
  tags: string[]
}

export type BlogPostMeta = BlogFrontmatter

export type BlogPost = {
  frontmatter: BlogFrontmatter
  content: string
}

const BLOG_CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')

function assertFrontmatter(value: Partial<BlogFrontmatter>, source: string): BlogFrontmatter {
  if (!value.title || !value.date || !value.excerpt || !value.slug || !value.readingTime || !Array.isArray(value.tags)) {
    throw new Error(`Invalid frontmatter in ${source}`)
  }

  return {
    title: value.title,
    date: value.date,
    excerpt: value.excerpt,
    metaDescription: value.metaDescription,
    slug: value.slug,
    readingTime: value.readingTime,
    tags: value.tags,
  }
}

function sortPostsNewestFirst(posts: BlogPostMeta[]) {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

async function getBlogFileNames() {
  const entries = await fs.readdir(BLOG_CONTENT_DIR)
  return entries.filter((entry) => entry.endsWith('.mdx'))
}

export async function getAllBlogPostsMeta(): Promise<BlogPostMeta[]> {
  const fileNames = await getBlogFileNames()

  const posts = await Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(BLOG_CONTENT_DIR, fileName)
      const raw = await fs.readFile(fullPath, 'utf8')
      const { data } = matter(raw)
      return assertFrontmatter(data as Partial<BlogFrontmatter>, fileName)
    }),
  )

  return sortPostsNewestFirst(posts)
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  return getAllBlogPostsMeta()
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const fullPath = path.join(BLOG_CONTENT_DIR, `${slug}.mdx`)

  try {
    const raw = await fs.readFile(fullPath, 'utf8')
    const { data, content } = matter(raw)
    return {
      frontmatter: assertFrontmatter(data as Partial<BlogFrontmatter>, `${slug}.mdx`),
      content,
    }
  } catch {
    return null
  }
}

export async function getRelatedBlogPosts(slug: string, tags: string[], limit = 2): Promise<BlogPostMeta[]> {
  const allPosts = await getAllBlogPostsMeta()

  const scored = allPosts
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const overlap = post.tags.filter((tag) => tags.includes(tag)).length
      return { post, overlap }
    })
    .sort((a, b) => {
      if (a.overlap !== b.overlap) {
        return b.overlap - a.overlap
      }

      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
    })

  return scored.slice(0, limit).map((item) => item.post)
}

export function formatBlogDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
