import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { z } from 'zod'
import type {
  ResourceDefinition,
  ResourceHooksConfig,
  UseListOptions,
  UseGetOptions,
  QueryResult,
  MutationResult,
} from './types'

type InferSchemaType<T extends z.ZodObject<any>> = z.infer<T>

export function createResourceHooks<TSchema extends z.ZodObject<any>>(
  resource: ResourceDefinition & { schema: TSchema },
  config: ResourceHooksConfig
) {
  type TResource = InferSchemaType<TSchema>
  type TCreateInput = Pick<TResource, (typeof resource.createFields)[number]>
  type TUpdateInput = Partial<Pick<TResource, (typeof resource.updateFields)[number]>>

  const { baseUrl, optimistic = false, keyPrefix = '' } = config
  const resourceName = resource.name
  const pluralName = `${resourceName}s` // Simple pluralization

  // Helper to build API URLs
  const getApiUrl = (path: string = '') => {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${base}/${pluralName}${path}`
  }

  // Helper to build query keys
  const getQueryKey = (type: 'list' | 'get', params?: any) => {
    const prefix = keyPrefix ? [keyPrefix] : []
    if (type === 'list') {
      return params ? [...prefix, pluralName, params] : [...prefix, pluralName]
    }
    return [...prefix, resourceName, params]
  }

  // Fetch helper
  const fetchJson = async <T,>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  }

  // useList hook
  function useList(options: UseListOptions<TResource> = {}): QueryResult<TResource[]> {
    const queryKey = getQueryKey('list', options.where || options.orderBy ? options : undefined)

    const query = useQuery({
      queryKey,
      queryFn: async () => {
        // Build query string from options
        const params = new URLSearchParams()
        if (options.where) {
          Object.entries(options.where).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value))
          })
        }
        const queryString = params.toString()
        const url = getApiUrl(queryString ? `?${queryString}` : '')
        return fetchJson<TResource[]>(url)
      },
    })

    return {
      data: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    }
  }

  // useGet hook
  function useGet(id: string, _options: UseGetOptions = {}): QueryResult<TResource> {
    const queryKey = getQueryKey('get', id)

    const query = useQuery({
      queryKey,
      queryFn: async () => {
        const url = getApiUrl(`/${id}`)
        return fetchJson<TResource>(url)
      },
      enabled: !!id,
    })

    return {
      data: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    }
  }

  // useCreate hook
  function useCreate(): MutationResult<TResource, TCreateInput> {
    const queryClient = useQueryClient()

    const mutation = useMutation({
      mutationFn: async (data: TCreateInput) => {
        const url = getApiUrl()
        return fetchJson<TResource>(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      },
      onSuccess: () => {
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: getQueryKey('list') })
      },
    })

    return {
      mutate: mutation.mutate,
      mutateAsync: mutation.mutateAsync,
      isLoading: mutation.isPending,
      isError: mutation.isError,
      error: mutation.error,
      reset: mutation.reset,
    }
  }

  // useUpdate hook
  function useUpdate(): MutationResult<
    TResource,
    { id: string } & TUpdateInput
  > {
    const queryClient = useQueryClient()

    const mutation = useMutation({
      mutationFn: async ({ id, ...data }: { id: string } & TUpdateInput) => {
        const url = getApiUrl(`/${id}`)
        return fetchJson<TResource>(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      },
      onMutate: async (variables) => {
        if (!optimistic) return

        const queryKey = getQueryKey('get', variables.id)

        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey })

        // Snapshot previous value
        const previous = queryClient.getQueryData(queryKey)

        // Optimistically update
        queryClient.setQueryData(queryKey, (old: any) => ({
          ...old,
          ...variables,
        }))

        return { previous, queryKey }
      },
      onError: (_err, _variables, context: any) => {
        if (!optimistic || !context) return

        // Rollback on error
        queryClient.setQueryData(context.queryKey, context.previous)
      },
      onSuccess: async (_data, variables) => {
        // Refetch queries immediately to ensure UI updates
        await queryClient.refetchQueries({ queryKey: getQueryKey('get', variables.id) })
        await queryClient.refetchQueries({ queryKey: getQueryKey('list') })
      },
    })

    return {
      mutate: mutation.mutate,
      mutateAsync: mutation.mutateAsync,
      isLoading: mutation.isPending,
      isError: mutation.isError,
      error: mutation.error,
      reset: mutation.reset,
    }
  }

  // useDelete hook
  function useDelete(): MutationResult<void, string> {
    const queryClient = useQueryClient()

    const mutation = useMutation({
      mutationFn: async (id: string) => {
        const url = getApiUrl(`/${id}`)
        await fetchJson<{ success: boolean }>(url, {
          method: 'DELETE',
        })
      },
      onSuccess: (_, id) => {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: getQueryKey('get', id) })
        queryClient.invalidateQueries({ queryKey: getQueryKey('list') })
      },
    })

    return {
      mutate: mutation.mutate,
      mutateAsync: mutation.mutateAsync,
      isLoading: mutation.isPending,
      isError: mutation.isError,
      error: mutation.error,
      reset: mutation.reset,
    }
  }

  return {
    useList,
    useGet,
    useCreate,
    useUpdate,
    useDelete,
  }
}
