import { useState, useEffect, useCallback } from 'react'

export interface AppRouter {
  pathname: string
  hash: string
  // popLocation only updates on browser back/forward (popstate), not on programmatic navigate
  popLocation: { pathname: string; hash: string }
  navigate: (path: string, hash?: string, replace?: boolean) => void
}

export function useAppRouter(): AppRouter {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [hash, setHash] = useState(() => window.location.hash)
  const [popLocation, setPopLocation] = useState(() => ({
    pathname: window.location.pathname,
    hash: window.location.hash,
  }))

  useEffect(() => {
    const handlePopState = () => {
      const newPathname = window.location.pathname
      const newHash = window.location.hash
      setPathname(newPathname)
      setHash(newHash)
      setPopLocation({ pathname: newPathname, hash: newHash })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((path: string, newHash = '', replace = false) => {
    const hashStr = newHash ? (newHash.startsWith('#') ? newHash : `#${newHash}`) : ''
    const url = `${path}${hashStr}`
    if (replace) {
      window.history.replaceState(null, '', url)
    } else {
      window.history.pushState(null, '', url)
    }
    setPathname(path)
    setHash(hashStr)
    // popLocation is NOT updated here — only popstate updates it
  }, [])

  return { pathname, hash, popLocation, navigate }
}
