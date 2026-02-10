import { SearchIcon, XIcon } from '../../icons/icons'
import type { TaskPriority, TaskType } from '../../types'
import styles from './TaskFilters.module.css'

export interface TaskFilters {
  search: string
  assignees: string[]
  priorities: TaskPriority[]
  types: TaskType[]
}

export interface TaskFiltersProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

const assigneeOptions = ['pm', 'engineer', 'qa', 'lead']
const priorityOptions: TaskPriority[] = ['critical', 'high', 'medium', 'low']
const typeOptions: TaskType[] = ['epic', 'api', 'backend', 'frontend', 'testing', 'documentation', 'devops']

export function TaskFiltersComponent({ filters, onChange }: TaskFiltersProps) {
  const activeFilterCount = 
    filters.assignees.length + 
    filters.priorities.length + 
    filters.types.length +
    (filters.search ? 1 : 0)

  const handleSearchChange = (search: string) => {
    onChange({ ...filters, search })
  }

  const handleAssigneeToggle = (assignee: string) => {
    const assignees = filters.assignees.includes(assignee)
      ? filters.assignees.filter(a => a !== assignee)
      : [...filters.assignees, assignee]
    onChange({ ...filters, assignees })
  }

  const handlePriorityToggle = (priority: TaskPriority) => {
    const priorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority]
    onChange({ ...filters, priorities })
  }

  const handleTypeToggle = (type: TaskType) => {
    const types = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onChange({ ...filters, types })
  }

  const handleClearAll = () => {
    onChange({
      search: '',
      assignees: [],
      priorities: [],
      types: [],
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <SearchIcon width={16} height={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search tasks by key or title..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={styles.searchInput}
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange('')}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            <XIcon width={14} height={14} />
          </button>
        )}
      </div>

      <div className={styles.filterGroups}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Assignee</label>
          <div className={styles.filterOptions}>
            {assigneeOptions.map(assignee => (
              <label key={assignee} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={filters.assignees.includes(assignee)}
                  onChange={() => handleAssigneeToggle(assignee)}
                />
                <span>{assignee.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Priority</label>
          <div className={styles.filterOptions}>
            {priorityOptions.map(priority => (
              <label key={priority} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={filters.priorities.includes(priority)}
                  onChange={() => handlePriorityToggle(priority)}
                />
                <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type</label>
          <div className={styles.filterOptions}>
            {typeOptions.map(type => (
              <label key={type} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                />
                <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className={styles.filterActions}>
          <span className={styles.filterCount}>
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
          </span>
          <button onClick={handleClearAll} className={styles.clearAllButton}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
