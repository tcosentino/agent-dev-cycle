# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bug Fixing Process

When a bug or issue is reported:
1. First, write a test that reproduces the bug
2. Run the test to verify it fails
3. Fix the bug
4. Run the test to verify it passes

Do not skip the test step - always reproduce the issue with a failing test first.

## Project Overview

AgentForge - AI-powered custom software development service demo/landing page built with Vite and TypeScript.

## Commands

```bash
yarn dev      # Start development server
yarn build    # Build for production (runs tsc && vite build)
yarn preview  # Preview production build
```

## Structure

- `src/main.ts` - Main TypeScript entry point with HTML content and page logic
- `src/style.css` - All styles for the landing page
- `index.html` - Vite entry point
