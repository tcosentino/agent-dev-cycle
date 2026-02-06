FROM node:22-slim

# Install git and ssh client for repo operations
RUN apt-get update && apt-get install -y git openssh-client && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally (as root, before switching user)
RUN npm install -g @anthropic-ai/claude-code

# Create non-root user (required for --dangerously-skip-permissions)
RUN useradd -m -s /bin/bash agent && \
    mkdir -p /home/agent/.ssh /home/agent/.claude /workspace && \
    ssh-keyscan github.com >> /home/agent/.ssh/known_hosts 2>/dev/null && \
    chown -R agent:agent /home/agent /workspace

# Set up runner
WORKDIR /runner
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Install the agentforge CLI globally
RUN chmod +x /runner/dist/src/cli/index.js && \
    ln -s /runner/dist/src/cli/index.js /usr/local/bin/agentforge

# Switch to non-root user
USER agent
WORKDIR /workspace

ENTRYPOINT ["node", "/runner/dist/src/index.js"]
