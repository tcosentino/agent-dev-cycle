# Beyond Permission Prompts: Making Claude Code More Secure and Autonomous

**Published:** October 20, 2025
**Source:** https://www.anthropic.com/engineering/claude-code-sandboxing

## Overview

Anthropic has introduced two new sandboxing features for Claude Code designed to enhance developer security while reducing permission prompts by 84%. These innovations enable Claude to work more autonomously within defined boundaries.

## The Problem: Approval Fatigue

Claude Code operates on a permission-based model where users must approve most file modifications and command executions. While this provides security, it creates "approval fatigue," where developers may overlook what they're approving, paradoxically reducing safety.

## The Solution: Sandboxing Architecture

The approach implements two complementary boundaries:

**Filesystem Isolation**
Claude can only access or modify specific directories, preventing prompt-injected instances from altering sensitive system files.

**Network Isolation**
Claude connects only to approved servers through a proxy, preventing data exfiltration or malware downloads. Both protections are essential—filesystem isolation alone leaves escape routes, while network isolation alone allows SSH key theft.

## Two New Features

### Sandboxed Bash Tool

Available as a beta research preview, this runtime uses OS-level primitives like Linux bubblewrap and macOS seatbelt to enforce restrictions. Users define accessible directories and network hosts. Claude executes commands safely within these limits; attempts to access external resources trigger user notifications.

### Claude Code on the Web

This cloud-based sandbox executes Claude Code sessions in isolation while keeping sensitive credentials (git tokens, signing keys) outside the sandbox. A custom proxy handles git interactions, validating authentication and preventing unauthorized pushes.

## Getting Started

- Run `/sandbox` in Claude for configuration details
- Visit `claude.com/code` to try Claude Code on the web
- Access open-sourced sandboxing code on GitHub for custom agent implementations

**Article Authors:** David Dworken and Oliver Weller-Davies, with contributions from Meaghan Choi, Catherine Wu, Molly Vorwerck, Alex Isken, Kier Bradwell, and Kevin Garcia
