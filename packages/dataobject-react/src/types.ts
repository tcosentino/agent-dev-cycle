import type { z } from 'zod'

export interface ResourceDefinition {
  name: string
  schema: z.ZodObject<any>
  createFields: string[]
  updateFields: string[]
  unique?: string[]
  searchable?: string[]
  relations?: Record<string, any>
}

export interface ResourceHooksConfig {
  baseUrl: string
  queryClient?: any
  optimistic?: boolean
  keyPrefix?: string
}

export interface UseListOptions<T = any> {
  where?: Partial<T>
  orderBy?: Record<keyof T, 'asc' | 'desc'>
  page?: number
  pageSize?: number
  include?: string[]
  subscribe?: boolean
}

export interface UseGetOptions {
  include?: string[]
  subscribe?: boolean
}

export interface QueryResult<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export interface MutationResult<TData = any, TVariables = any> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  isLoading: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}
