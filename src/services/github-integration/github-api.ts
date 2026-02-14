// GitHub API client wrapper

const GITHUB_API_BASE = 'https://api.github.com'

export interface GitHubUser {
  id: number
  login: string
  email: string | null
  avatar_url: string
  name: string | null
}

export interface GitHubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
  url: string
}

export interface GitHubTree {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

export interface GitHubContent {
  name: string
  path: string
  sha: string
  size: number
  type: 'file' | 'dir'
  content?: string  // base64 encoded
  encoding?: string
}

// Exchange OAuth code for access token
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; token_type: string; scope: string }> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to exchange code for token: ${res.status}`)
  }

  const data = await res.json()
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
  }

  return data
}

// Get authenticated user
export async function getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to get user: ${res.status}`)
  }

  return res.json()
}

// Get user's primary email (if not public)
export async function getUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(`${GITHUB_API_BASE}/user/emails`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!res.ok) {
    return null
  }

  const emails = await res.json() as Array<{ email: string; primary: boolean; verified: boolean }>
  const primary = emails.find(e => e.primary && e.verified)
  return primary?.email ?? emails[0]?.email ?? null
}

// Get repository tree (recursive)
export async function getRepoTree(
  accessToken: string,
  owner: string,
  repo: string,
  branch = 'main'
): Promise<GitHubTree> {
  // First get the default branch SHA
  const refRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!refRes.ok) {
    // Try 'master' if 'main' fails
    if (branch === 'main') {
      return getRepoTree(accessToken, owner, repo, 'master')
    }
    throw new Error(`Failed to get branch ref: ${refRes.status}`)
  }

  const ref = await refRes.json()
  const sha = ref.object.sha

  // Get the tree recursively
  const treeRes = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!treeRes.ok) {
    throw new Error(`Failed to get tree: ${treeRes.status}`)
  }

  return treeRes.json()
}

// Get file content
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch = 'main'
): Promise<string> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!res.ok) {
    // Try 'master' if 'main' fails
    if (branch === 'main') {
      return getFileContent(accessToken, owner, repo, path, 'master')
    }
    throw new Error(`Failed to get file content: ${res.status}`)
  }

  const data: GitHubContent = await res.json()

  if (data.type !== 'file' || !data.content) {
    throw new Error(`Not a file or no content available: path="${path}", type="${data.type}"`)
  }

  // Decode base64 content
  return Buffer.from(data.content, 'base64').toString('utf-8')
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  html_url: string
  clone_url: string
  default_branch: string
  updated_at: string
}

// Get user's repositories
export async function getUserRepos(
  accessToken: string,
  options: { perPage?: number; sort?: 'updated' | 'pushed' | 'full_name' } = {}
): Promise<GitHubRepo[]> {
  const { perPage = 100, sort = 'updated' } = options
  const res = await fetch(
    `${GITHUB_API_BASE}/user/repos?per_page=${perPage}&sort=${sort}&affiliation=owner,collaborator,organization_member`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to get user repos: ${res.status}`)
  }

  return res.json()
}

// Parse GitHub repo URL to extract owner and repo
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)(\.git)?/)
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] }
  }

  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/.]+)(\.git)?/)
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] }
  }

  return null
}
