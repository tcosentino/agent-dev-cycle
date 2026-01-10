import { useState, useCallback, useRef, useEffect } from 'react'

export interface StoryStep<T> {
  delay: number
  state: T | ((prev: T) => T)
}

export interface Story<T> {
  initialState: T
  steps: StoryStep<T>[]
}

export interface StoryPlayerOptions {
  autoPlay?: boolean
  loop?: boolean
  loopDelay?: number
}

export interface StoryPlayerResult<T> {
  state: T
  isPlaying: boolean
  play: () => void
  reset: () => void
  stop: () => void
}

export function useStoryPlayer<T>(
  story: Story<T>,
  options: StoryPlayerOptions = {}
): StoryPlayerResult<T> {
  const { autoPlay = false, loop = false, loopDelay = 2000 } = options

  const [state, setState] = useState<T>(story.initialState)
  const [isPlaying, setIsPlaying] = useState(false)
  const timeoutsRef = useRef<number[]>([])
  const hasAutoPlayedRef = useRef(false)

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id))
    timeoutsRef.current = []
  }, [])

  const reset = useCallback(() => {
    clearTimeouts()
    setState(story.initialState)
    setIsPlaying(false)
  }, [story.initialState, clearTimeouts])

  const play = useCallback(() => {
    clearTimeouts()
    setState(story.initialState)
    setIsPlaying(true)

    // Schedule each step
    story.steps.forEach(({ delay, state: stepState }) => {
      const id = window.setTimeout(() => {
        if (typeof stepState === 'function') {
          setState(prev => (stepState as (prev: T) => T)(prev))
        } else {
          setState(stepState)
        }
      }, delay)
      timeoutsRef.current.push(id)
    })

    // Mark as complete after last step
    const lastStep = story.steps[story.steps.length - 1]
    if (lastStep) {
      const completeId = window.setTimeout(() => {
        setIsPlaying(false)
      }, lastStep.delay)
      timeoutsRef.current.push(completeId)
    }
  }, [story, clearTimeouts])

  const stop = useCallback(() => {
    clearTimeouts()
    setIsPlaying(false)
  }, [clearTimeouts])

  // Auto-play on mount
  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true
      play()
    }
  }, [autoPlay, play])

  // Loop when animation completes
  useEffect(() => {
    if (loop && !isPlaying && hasAutoPlayedRef.current) {
      const loopId = window.setTimeout(() => {
        play()
      }, loopDelay)
      timeoutsRef.current.push(loopId)
    }
  }, [isPlaying, loop, loopDelay, play])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts()
  }, [clearTimeouts])

  return { state, isPlaying, play, reset, stop }
}
