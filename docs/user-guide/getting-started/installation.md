# Installation

> **Note:** This document describes the planned CLI-based installation experience. AgentForge is currently a development-mode application. See the [Development Setup](../../developer-guide/development-setup.md) for current instructions on running from source.

Get AgentForge up and running in minutes.

## Prerequisites

Before installing AgentForge, ensure you have:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **A code editor** (VS Code recommended)
- **Terminal/command line** access

### Check Your Environment

```bash
# Check Node.js version (should be 18+)
node --version

# Check Git
git --version
```

## Installation Methods

### Option 1: Install via npm (Recommended)

The fastest way to get started:

```bash
# Install AgentForge globally
npm install -g agentforge

# Verify installation
agentforge --version
```

### Option 2: Install via Yarn

If you prefer Yarn:

```bash
# Install globally
yarn global add agentforge

# Verify installation
agentforge --version
```

### Option 3: Clone from Source

For contributors or advanced users:

```bash
# Clone the repository
git clone https://github.com/tcosentino/agent-dev-cycle.git
cd agent-dev-cycle

# Install dependencies
yarn install

# Build the project
yarn build

# Link for global usage
yarn link

# Verify installation
agentforge --version
```

## Post-Installation

### Start the AgentForge Gateway

AgentForge runs as a background service:

```bash
# Start the gateway
agentforge gateway start

# Check status
agentforge gateway status
```

You should see:
```
✓ AgentForge Gateway running (PID: 12345)
✓ Web UI: http://localhost:3000
✓ API: http://localhost:3000/api
```

### Access the Web UI

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the AgentForge dashboard.

## Configuration

### Basic Configuration

AgentForge stores configuration in `~/.agentforge/config.yaml`:

```yaml
# Default configuration
port: 3000
workspaceDir: ~/.agentforge/workspace
models:
  default: anthropic/claude-sonnet-4
agents:
  defaultTimeout: 600
```

### Set Your Claude API Key

AgentForge requires a Claude API key:

```bash
# Set via environment variable
export ANTHROPIC_API_KEY="your-api-key-here"

# Or add to your shell profile (~/.zshrc or ~/.bashrc)
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc

# Reload shell
source ~/.zshrc
```

Or configure in the UI:
1. Open AgentForge UI
2. Go to Settings → Authentication
3. Enter your Claude API key
4. Click "Save"

## Verify Installation

Let's make sure everything works:

```bash
# Check gateway status
agentforge gateway status

# List available commands
agentforge help

# Check workspace
ls ~/.agentforge/workspace
```

## Troubleshooting

### Port Already in Use

If port 3000 is taken:

```bash
# Stop the gateway
agentforge gateway stop

# Edit config to use different port
nano ~/.agentforge/config.yaml
# Change: port: 3001

# Restart gateway
agentforge gateway start
```

### Permission Errors

If you see permission errors:

```bash
# On macOS/Linux, use sudo for global install
sudo npm install -g agentforge

# Or use a version manager (nvm recommended)
```

### Gateway Won't Start

Check the logs:

```bash
# View logs
tail -f ~/.agentforge/logs/gateway.log

# Or use the status command
agentforge gateway status --verbose
```

### Can't Access Web UI

1. Check firewall settings (allow port 3000)
2. Try `http://127.0.0.1:3000` instead of `localhost`
3. Check if another service is using port 3000
4. Restart the gateway: `agentforge gateway restart`

## Next Steps

✅ AgentForge is installed and running!

Now you're ready to:

- [Create your first project](./first-project.md)
- [Learn core concepts](./core-concepts.md)

## Getting Help

If you're stuck:

- Report issues on [GitHub](https://github.com/tcosentino/agent-dev-cycle/issues)
