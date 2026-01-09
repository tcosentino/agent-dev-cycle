# Animation Stories Pattern

## Overview

Animation Stories is a pattern for creating animated demos and previews of UI components. Instead of building special animation code into components, we define **stories** - sequences of state changes that play out over time. The visual animation emerges naturally from how the component handles state transitions.

## Core Principles

### 1. Components Stay Pure

The component being animated is the **real production component**. No special animation props, no demo mode, no conditional logic for previews. The same code that runs in the demo runs in production.

### 2. Animations Are State Transitions

An animation is simply a sequence of state changes with timing:

```typescript
type AnimationStep<T> = {
  delay: number      // ms from start
  action: () => void // state mutation
}

// Example: tasks moving through a kanban board
const story: AnimationStep[] = [
  { delay: 800,  action: () => updateTask('TASK-1', 'in-progress') },
  { delay: 1600, action: () => updateTask('TASK-2', 'in-progress') },
  { delay: 2400, action: () => updateTask('TASK-1', 'done') },
  // ...
]
```

### 3. Visual Animation Is Emergent

The smooth visual transitions come from how the component handles state changes - CSS transitions, FLIP animations, or animation libraries. This means:

- The demo looks exactly like the real app
- Animation bugs in the demo = animation bugs in production (caught early)
- No divergence between "demo mode" and "real mode"

## Implementation

### Step 1: Make Components Handle Transitions Gracefully

Use CSS transitions or FLIP animations so that when state changes, elements animate to their new positions:

```typescript
// FLIP animation in a list item component
function ListItem({ item }) {
  const ref = useRef<HTMLDivElement>(null)
  const prevRect = useRef<DOMRect | null>(null)

  // Capture position during render (before DOM update)
  if (ref.current) {
    prevRect.current = ref.current.getBoundingClientRect()
  }

  // After DOM update, animate from old position to new
  useLayoutEffect(() => {
    const el = ref.current
    const prev = prevRect.current
    if (!el || !prev) return

    const current = el.getBoundingClientRect()
    const deltaX = prev.left - current.left
    const deltaY = prev.top - current.top

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`
      el.style.transition = 'none'
      el.offsetHeight // force reflow
      el.style.transform = ''
      el.style.transition = 'transform 0.4s ease-out'
    }

    prevRect.current = null
  }, [item.status]) // re-run when status changes

  return <div ref={ref}>{/* ... */}</div>
}
```

### Step 2: Define the Story as Data

Create a typed structure that describes the animation sequence:

```typescript
interface StoryStep {
  delay: number
  description?: string  // for debugging/documentation
  action: () => void
}

interface Story {
  name: string
  duration: number
  steps: StoryStep[]
}

const taskBoardStory: Story = {
  name: 'Task Progression',
  duration: 7000,
  steps: [
    { delay: 800,  description: 'Start first task', action: () => moveTask('TASK-1', 'in-progress') },
    { delay: 1600, description: 'Start second task', action: () => moveTask('TASK-2', 'in-progress') },
    { delay: 2400, description: 'Complete first task', action: () => moveTask('TASK-1', 'done') },
    // ...
  ]
}
```

### Step 3: Create a Story Runner

A simple function that executes the story:

```typescript
function useStoryRunner() {
  const timeouts = useRef<number[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((story: Story, reset?: () => void) => {
    // Clear any existing animation
    timeouts.current.forEach(id => clearTimeout(id))
    timeouts.current = []

    // Reset to initial state
    reset?.()
    setIsPlaying(true)

    // Schedule all steps
    story.steps.forEach(({ delay, action }) => {
      const id = window.setTimeout(action, delay)
      timeouts.current.push(id)
    })

    // Mark complete
    const endId = window.setTimeout(() => setIsPlaying(false), story.duration)
    timeouts.current.push(endId)
  }, [])

  const stop = useCallback(() => {
    timeouts.current.forEach(id => clearTimeout(id))
    timeouts.current = []
    setIsPlaying(false)
  }, [])

  return { play, stop, isPlaying }
}
```

### Step 4: Wire It Up in the Preview

```typescript
function TaskBoardPreview() {
  const [tasks, setTasks] = useState(initialTasks)
  const story = useStoryRunner()

  const moveTask = (key: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.key === key ? { ...t, status } : t))
  }

  const taskBoardStory: Story = {
    name: 'Task Progression',
    duration: 7000,
    steps: [
      { delay: 800, action: () => moveTask('TASK-1', 'in-progress') },
      { delay: 1600, action: () => moveTask('TASK-2', 'in-progress') },
      // ...
    ]
  }

  return (
    <div>
      <button
        onClick={() => story.play(taskBoardStory, () => setTasks(initialTasks))}
        disabled={story.isPlaying}
      >
        {story.isPlaying ? 'Playing...' : 'Play Animation'}
      </button>

      <TaskBoard tasks={tasks} />
    </div>
  )
}
```

## Benefits

| Benefit | Why It Matters |
|---------|----------------|
| **No demo/prod divergence** | What you see in the preview is exactly what ships |
| **Testable animations** | Stories are data - you can unit test them |
| **Composable** | Stories can be combined, reversed, or parameterized |
| **Reusable** | Same story can drive demos, tests, documentation |
| **Production-ready by default** | If it animates in the story, it'll animate in the app |

## Advanced Patterns

### Parameterized Stories

```typescript
function createProgressionStory(taskKeys: string[], timing = 800): Story {
  const steps: StoryStep[] = []
  let delay = timing

  taskKeys.forEach(key => {
    steps.push({ delay, action: () => moveTask(key, 'in-progress') })
    delay += timing
    steps.push({ delay, action: () => moveTask(key, 'done') })
    delay += timing
  })

  return { name: 'Progression', duration: delay, steps }
}
```

### Story Composition

```typescript
const introStory = createFadeInStory()
const mainStory = createProgressionStory(['TASK-1', 'TASK-2'])
const outroStory = createCelebrationStory()

const fullDemo = composeStories([introStory, mainStory, outroStory])
```

### Interactive Stories

Stories can respond to user input by conditionally scheduling steps:

```typescript
const interactiveStory = {
  steps: [
    { delay: 0, action: () => showPrompt('Click a task to start') },
    // Next steps scheduled by user interaction, not delay
  ]
}
```

## Guidelines

1. **Keep components animation-agnostic** - They should just handle state changes gracefully
2. **Stories are just data** - Avoid putting complex logic in story definitions
3. **Test the component, not the story** - Stories are for visualization, not verification
4. **Use descriptions** - Document what each step represents for maintainability
5. **Consider timing carefully** - Too fast feels rushed, too slow feels boring (800ms is a good default between steps)
