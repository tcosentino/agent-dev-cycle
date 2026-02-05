import { useState, useEffect, useRef } from 'react'
import './nav.css'

interface NavProps {
  currentPage?: 'demo' | 'docs' | 'components'
}

export function Nav({ currentPage = 'demo' }: NavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <nav className="nav">
      <a href="/" className="nav-logo">
        <div className="nav-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        AgentForge
      </a>
      <div className="nav-links">
        <a href="/" className={`nav-link ${currentPage === 'demo' ? 'active' : ''}`}>
          Demo
        </a>
        <a href="/docs" className={`nav-link doc-link ${currentPage === 'docs' ? 'active' : ''}`}>
          Design Doc
        </a>
        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            className={`nav-link ${currentPage === 'components' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setDropdownOpen(!dropdownOpen)
            }}
          >
            Components
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dropdown-icon">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className={`nav-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
            <a href="/component-preview.html" className="nav-dropdown-item">Component Preview</a>
            <a href="/mockups.html" className="nav-dropdown-item">UI Mockups</a>
            <a href="/project-viewer.html" className="nav-dropdown-item">Project Viewer</a>
          </div>
        </div>
      </div>
    </nav>
  )
}
