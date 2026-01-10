#!/usr/bin/env npx ts-node

/**
 * Script to import Anthropic engineering blog posts into the research folder
 *
 * Usage: npx ts-node scripts/import-anthropic-blog.ts
 *
 * Requirements: Node.js 18+ (for native fetch)
 */

import * as fs from 'fs'
import * as path from 'path'

const BLOG_INDEX_URL = 'https://www.anthropic.com/engineering'
const OUTPUT_DIR = path.join(__dirname, '..', 'research')

interface BlogPost {
  title: string
  slug: string
  url: string
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.text()
}

function extractBlogLinks(html: string): BlogPost[] {
  const posts: BlogPost[] = []

  // Match links to /engineering/* posts
  const linkRegex = /href="(\/engineering\/([^"]+))"/g
  const titleRegex = /<h[23][^>]*>([^<]+)<\/h[23]>/g

  let match
  const seen = new Set<string>()

  while ((match = linkRegex.exec(html)) !== null) {
    const [, path, slug] = match
    if (slug && !seen.has(slug)) {
      seen.add(slug)
      posts.push({
        title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        slug,
        url: `https://www.anthropic.com${path}`
      })
    }
  }

  return posts
}

function htmlToMarkdown(html: string): string {
  // Basic HTML to Markdown conversion
  let md = html
    // Remove script and style tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Headers
    .replace(/<h1[^>]*>([^<]+)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>([^<]+)<\/h4>/gi, '#### $1\n\n')
    // Paragraphs
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi, '[$2]($1)')
    // Bold
    .replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**')
    // Italic
    .replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*')
    // Code
    .replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`')
    // Pre/code blocks
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n')
    // Lists
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return md
}

function extractArticleContent(html: string, post: BlogPost): string {
  // Try to extract the main article content
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)

  const content = articleMatch?.[1] || mainMatch?.[1] || html
  const markdown = htmlToMarkdown(content)

  // Try to extract publication date
  const dateMatch = html.match(/(\w+ \d{1,2}, \d{4})|(\d{4}-\d{2}-\d{2})/i)
  const date = dateMatch?.[0] || 'Unknown date'

  return `# ${post.title}

**Published:** ${date}
**Source:** ${post.url}

${markdown}
`
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function importBlogPosts() {
  console.log('Fetching blog index...')

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const indexHtml = await fetchPage(BLOG_INDEX_URL)
  const posts = extractBlogLinks(indexHtml)

  console.log(`Found ${posts.length} blog posts`)

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const filename = `${String(i + 1).padStart(2, '0')}-${sanitizeFilename(post.slug)}.md`
    const filepath = path.join(OUTPUT_DIR, filename)

    console.log(`[${i + 1}/${posts.length}] Fetching: ${post.slug}`)

    try {
      const html = await fetchPage(post.url)
      const content = extractArticleContent(html, post)
      fs.writeFileSync(filepath, content)
      console.log(`  Saved: ${filename}`)
    } catch (error) {
      console.error(`  Error fetching ${post.url}:`, error)
    }

    // Small delay to be polite to the server
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\nDone! Blog posts saved to:', OUTPUT_DIR)
}

// Run the script
importBlogPosts().catch(console.error)
