# Desktop Extensions: One-Click MCP Server Installation for Claude Desktop

**Published:** June 26, 2025
**Source:** https://www.anthropic.com/engineering/desktop-extensions

## Overview

Anthropic has introduced Desktop Extensions, a new packaging format that simplifies installing Model Context Protocol (MCP) servers for Claude Desktop users. The solution transforms a complex installation process into a single-click experience.

## The Problem

Previously, setting up local MCP servers required:
- Installing developer tools (Node.js, Python)
- Manual JSON configuration file editing
- Resolving package conflicts and version mismatches
- Searching GitHub to discover servers
- Manual reinstallation for updates

These barriers kept powerful MCP capabilities inaccessible to non-technical users.

## The Solution: .mcpb Files

Desktop Extensions package entire MCP servers—including all dependencies—into single `.mcpb` files. Users simply:
1. Download a `.mcpb` file
2. Double-click to open with Claude Desktop
3. Click "Install"

## Technical Architecture

A `.mcpb` file is a ZIP archive containing:
- `manifest.json` (required metadata)
- Server implementation files
- Bundled dependencies
- Optional icon

Claude Desktop handles complexity by:
- Providing built-in Node.js runtime
- Managing automatic updates
- Storing sensitive data in OS keychains

## Getting Started

Developers can create extensions using:

```bash
npx @anthropic-ai/mcpb init
npx @anthropic-ai/mcpb pack
```

The manifest supports user configuration, cross-platform settings, and feature declarations.

## Open Ecosystem

Anthropic is open-sourcing the MCPB specification, packaging tools, and reference implementations, enabling other AI applications to support Desktop Extensions.

## Security & Enterprise Features

Safeguards include OS keychain integration, automatic updates, MDM/Group Policy support, extension blocklisting, and private extension directories.
