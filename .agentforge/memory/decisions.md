# Decision Log

## 2026-02-06 - Test Results View Architecture

### Decision: WebSocket + CLI Integration Architecture
**Context**: Need to display test results from both Vitest and Playwright in a unified UI

**Options Considered**:
1. Direct programmatic API integration with test runners
2. File system polling of test output files
3. WebSocket service that executes CLI commands and streams results

**Decision**: WebSocket + CLI integration (#3)

**Rationale**:
- Both Vitest and Playwright have mature JSON reporter options
- CLI integration is more stable than programmatic APIs
- WebSocket enables real-time updates and test cancellation
- Simpler to implement and maintain
- Avoids version coupling with test runner internal APIs

**Trade-offs**:
- Slightly more overhead than direct API integration
- Requires JSON output parsing
- Process management complexity

### Decision: 4-Phase Implementation Strategy
**Context**: Medium appetite (3-4 weeks) requires careful scope management

**Decision**: Implement in phases with each phase delivering user value:
1. **Phase 1**: Test file discovery and basic UI
2. **Phase 2**: Test execution and results display
3. **Phase 3**: Failure details and debugging support
4. **Phase 4**: Coverage, performance, and polish

**Rationale**:
- Each phase delivers standalone value
- Allows for scope adjustment if timeline pressure occurs
- Enables early user feedback and course correction
- Risk mitigation through incremental delivery

### Decision: React Component Integration
**Context**: Need to choose implementation approach for UI

**Decision**: Build as React components within existing AgentForge UI structure

**Rationale**:
- Leverages existing React 19 + Vite setup
- Maintains design consistency
- Can reuse existing components and utilities
- Integrates with current routing and state management

### Decision: JSON Output Parsing Strategy
**Context**: Need to normalize test results from different runners

**Decision**: Create parser adapters for each test runner's JSON output format

**Rationale**:
- Both tools support stable JSON output formats
- Parser pattern allows for easy extension to new test runners
- Normalizes data into common interface for UI consumption
- Testable and maintainable approach

**Implementation Notes**:
- VitestParser handles vitest JSON reporter output
- PlaywrightParser handles playwright JSON reports
- Common TestResult interface for normalized data

These decisions establish the technical foundation for the Test Results View implementation.