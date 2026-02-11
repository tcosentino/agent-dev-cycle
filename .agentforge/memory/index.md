# Agent Memory Index

This directory contains memories of bugs fixed, patterns learned, and decisions made while working on this codebase.

## Bug Fixes

- [render-loop-audit.md](render-loop-audit.md) - Systematic audit of React components for render loop issues (2026-02-11)
- [duplicate-file-loads.md](duplicate-file-loads.md) - Fixed agent files loading 6+ times due to parent component recreating objects (2026-02-11)

## Patterns Learned

### React Performance
- Memo dependencies should be stable references, not recreated objects
- Use `useRef` to track state across renders without triggering re-renders
- Effects should depend on primitive values (IDs, strings) not objects when possible

### SSE & Real-time Updates
- SSE streams keep multiple clients synchronized
- Emit events for all state-changing operations
- Never use `window.location.reload()` when SSE can handle updates

---

*Last updated: 2026-02-11*
