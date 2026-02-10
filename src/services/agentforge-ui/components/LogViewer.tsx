import { useState, useMemo } from 'react'
import { SearchIcon, DownloadIcon, XIcon } from '@agentforge/ui-components'
import styles from './LogViewer.module.css'

export interface LogEntry {
  stage: string
  log: string
  error?: string
}

export interface LogViewerProps {
  workloadId: string
  workloadName: string
  logs: LogEntry[]
  onClose: () => void
}

type LogLevel = 'all' | 'error' | 'warn' | 'info'

/**
 * Display and filter workload logs
 * - Search by text
 * - Filter by log level
 * - Download logs
 * - Syntax highlighting for errors
 */
export function LogViewer({ workloadId, workloadName, logs, onClose }: LogViewerProps) {
  const [searchText, setSearchText] = useState('')
  const [logLevel, setLogLevel] = useState<LogLevel>('all')

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = logs

    // Filter by level
    if (logLevel === 'error') {
      filtered = filtered.filter(entry => entry.error || entry.log.toLowerCase().includes('error'))
    } else if (logLevel === 'warn') {
      filtered = filtered.filter(entry => entry.log.toLowerCase().includes('warn'))
    } else if (logLevel === 'info') {
      filtered = filtered.filter(entry => 
        !entry.error && 
        !entry.log.toLowerCase().includes('error') && 
        !entry.log.toLowerCase().includes('warn')
      )
    }

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.log.toLowerCase().includes(search) || 
        entry.stage.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [logs, searchText, logLevel])

  // Download logs as text file
  const handleDownload = () => {
    const content = logs
      .map(entry => `[${entry.stage}] ${entry.log}`)
      .join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workloadId}-${Date.now()}.log`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Syntax highlighting for log lines
  const formatLogLine = (entry: LogEntry) => {
    const isError = entry.error || entry.log.toLowerCase().includes('error')
    const isWarn = entry.log.toLowerCase().includes('warn')
    
    return (
      <div 
        key={`${entry.stage}-${entry.log}`}
        className={`${styles.logLine} ${isError ? styles.error : isWarn ? styles.warn : ''}`}
      >
        <span className={styles.stage}>[{entry.stage}]</span>
        <span className={styles.message}>{entry.log}</span>
      </div>
    )
  }

  return (
    <div className={styles.logViewerOverlay} onClick={onClose}>
      <div className={styles.logViewer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <h2>Logs: {workloadName}</h2>
            <span className={styles.workloadId}>Workload ID: {workloadId}</span>
          </div>
          <button className={styles.closeButton} onClick={onClose} title="Close">
            <XIcon />
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.searchBox}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Level filter */}
          <div className={styles.filterGroup}>
            <label>Level:</label>
            <select 
              value={logLevel} 
              onChange={(e) => setLogLevel(e.target.value as LogLevel)}
              className={styles.select}
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Download button */}
          <button 
            className={styles.downloadButton} 
            onClick={handleDownload}
            title="Download logs"
          >
            <DownloadIcon />
            <span>Download</span>
          </button>
        </div>

        {/* Log content */}
        <div className={styles.logContent}>
          {filteredLogs.length === 0 && logs.length === 0 && (
            <div className={styles.emptyState}>No logs available</div>
          )}
          {filteredLogs.length === 0 && logs.length > 0 && (
            <div className={styles.emptyState}>No logs match your filters</div>
          )}
          {filteredLogs.length > 0 && (
            <div className={styles.logLines}>
              {filteredLogs.map((entry, i) => (
                <div key={i}>
                  {formatLogLine(entry)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.logCount}>
            {filteredLogs.length} / {logs.length} logs
          </span>
        </div>
      </div>
    </div>
  )
}
