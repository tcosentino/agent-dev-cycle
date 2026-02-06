import { useMemo } from 'react'
import { markdownToHtml } from './utils'
import styles from '../ProjectViewer.module.css'

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => markdownToHtml(content), [content])
  return <div className={styles.markdownContent} dangerouslySetInnerHTML={{ __html: html }} />
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

interface TranscriptEntry {
  type?: string
  content?: string
  output?: string
  input?: unknown
  tool?: string
  timestamp?: string
  summary?: string
  [key: string]: unknown
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
  }, [content])

  const typeClass = (type?: string) => {
    switch (type) {
      case 'system': return styles.typeSystem
      case 'assistant': return styles.typeAssistant
      case 'tool_call': return styles.typeToolCall
      case 'tool_result': return styles.typeToolResult
      default: return styles.typeSystem
    }
  }

  return (
    <div className={styles.timeline}>
      {entries.map((entry, i) => {
        const body = entry.content
          || entry.output
          || entry.summary
          || (typeof entry.input === 'string' ? entry.input : null)
        const codeBody = typeof entry.input === 'object' && entry.input !== null
          ? JSON.stringify(entry.input, null, 2)
          : null

        return (
          <div key={i} className={`${styles.timelineEntry} ${typeClass(entry.type)}`}>
            <div className={styles.timelineMarker} />
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={`${styles.timelineType} ${typeClass(entry.type)}`}>
                  {entry.type || 'unknown'}
                </span>
                {entry.tool && <span className={styles.timelineTool}>{entry.tool}</span>}
                {entry.timestamp && (
                  <span className={styles.timelineTime}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {body && <div className={styles.timelineBody}>{body}</div>}
              {codeBody && <code className={styles.timelineBodyCode}>{codeBody}</code>}
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
