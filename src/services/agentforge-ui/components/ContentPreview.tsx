import { useMemo, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import mermaid from 'mermaid'
import styles from '../ProjectViewer.module.css'

// Initialize mermaid with dark theme support
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
})

// Component to render mermaid diagrams
function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    if (!containerRef.current) return

    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(idRef.current, code)
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="${styles.mermaidError}">Failed to render diagram:\n${code}</pre>`
        }
      }
    }

    renderDiagram()
  }, [code])

  return <div ref={containerRef} className={styles.mermaidContainer} />
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom code block handler for mermaid
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            // Handle mermaid code blocks
            if (language === 'mermaid') {
              const code = String(children).replace(/\n$/, '')
              return <MermaidDiagram code={code} />
            }

            // Inline code
            if (!className) {
              return <code {...props}>{children}</code>
            }

            // Regular code blocks with syntax highlighting class
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          // Wrap pre blocks for styling
          pre({ children }) {
            return <pre className={styles.codeBlock}>{children}</pre>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function YamlPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    return content
      .split('\n')
      .map(line =>
        line
          .replace(/^(\s*)([\w-]+)(:)/g, `$1<span class="${styles.yamlKey}">$2</span>$3`)
          .replace(/'([^']+)'/g, `<span class="${styles.yamlString}">'$1'</span>`)
      )
      .join('\n')
  }, [content])

  return <pre className={styles.yamlContent} dangerouslySetInnerHTML={{ __html: html }} />
}

// Claude Code transcript entry types
interface ContentBlock {
  type: string
  text?: string
  name?: string
  input?: unknown
  tool_use_id?: string
}

interface TranscriptEntry {
  type: string
  timestamp?: string
  message?: {
    role?: string
    content?: ContentBlock[] | string
  }
  [key: string]: unknown
}

// Extract displayable content from a transcript entry
function extractContent(entry: TranscriptEntry): { texts: string[]; toolCalls: { name: string; input: unknown }[] } {
  const texts: string[] = []
  const toolCalls: { name: string; input: unknown }[] = []

  const msg = entry.message
  if (!msg) return { texts, toolCalls }

  const content = msg.content
  if (typeof content === 'string') {
    texts.push(content)
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === 'text' && block.text) {
        // Skip IDE notification messages
        if (!block.text.startsWith('<ide_')) {
          texts.push(block.text)
        }
      } else if (block.type === 'tool_use' && block.name) {
        toolCalls.push({ name: block.name, input: block.input })
      } else if (block.type === 'tool_result' && block.text) {
        texts.push(block.text)
      }
    }
  }

  return { texts, toolCalls }
}

function JsonlTimeline({ content }: { content: string }) {
  const entries = useMemo<TranscriptEntry[]>(() => {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line) as TranscriptEntry }
        catch { return null }
      })
      .filter((e): e is TranscriptEntry => e !== null)
      // Filter to only show user/assistant/system messages
      .filter(e => ['user', 'assistant', 'system'].includes(e.type))
  }, [content])

  const typeClass = (type?: string) => {
    switch (type) {
      case 'system': return styles.typeSystem
      case 'user': return styles.typeUser
      case 'assistant': return styles.typeAssistant
      default: return styles.typeSystem
    }
  }

  return (
    <div className={styles.timeline}>
      {entries.map((entry, i) => {
        const { texts, toolCalls } = extractContent(entry)

        // Skip entries with no content
        if (texts.length === 0 && toolCalls.length === 0) {
          return null
        }

        return (
          <div key={i} className={`${styles.timelineEntry} ${typeClass(entry.type)}`}>
            <div className={styles.timelineMarker} />
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={`${styles.timelineType} ${typeClass(entry.type)}`}>
                  {entry.type}
                </span>
                {entry.timestamp && (
                  <span className={styles.timelineTime}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {texts.map((text, j) => (
                <div key={j} className={styles.timelineBody}>{text}</div>
              ))}
              {toolCalls.map((tool, j) => (
                <div key={`tool-${j}`} className={styles.timelineToolCall}>
                  <span className={styles.timelineToolName}>{tool.name}</span>
                  {tool.input != null && (
                    <code className={styles.timelineBodyCode}>
                      {JSON.stringify(tool.input, null, 2)}
                    </code>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JsonPreview({ content }: { content: string }) {
  const html = useMemo(() => {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2)
      return formatted
        .replace(/("(?:\\.|[^"\\])*")\s*:/g, `<span class="${styles.yamlKey}">$1</span>:`)
        .replace(/:\s*("(?:\\.|[^"\\])*")/g, `: <span class="${styles.yamlString}">$1</span>`)
    } catch {
      return content
    }
  }, [content])

  return <pre className={styles.yamlContent} dangerouslySetInnerHTML={{ __html: html }} />
}

function RawTextPreview({ content }: { content: string }) {
  return <pre className={styles.rawContent}>{content}</pre>
}

export function ContentPreview({ path, content }: { path: string; content: string }) {
  const ext = path.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'md':
      return <MarkdownPreview content={content} />
    case 'yaml':
    case 'yml':
      return <YamlPreview content={content} />
    case 'json':
      return <JsonPreview content={content} />
    case 'jsonl':
      return <JsonlTimeline content={content} />
    default:
      return <RawTextPreview content={content} />
  }
}
