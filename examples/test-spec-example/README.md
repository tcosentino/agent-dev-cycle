# Test-Spec Linkage Example

This example demonstrates the complete Test-Spec Linkage workflow.

## Files

```
test-spec-example/
├── spec.md              # OpenSpec with scenario IDs
├── Counter.tsx          # React component implementation
├── Counter.test.tsx     # Tests using describeSpec()
├── coverage.json        # Generated coverage manifest
└── README.md            # This file
```

## How It Works

### 1. Write the Spec (spec.md)

Define scenarios with unique IDs:

```markdown
#### Scenario: User clicks increment button
**ID:** `counter-002`
**Priority:** critical
**Test Status:** ✅ covered

- **WHEN** user clicks "Increment" button
- **THEN** count increases by 1
```

**Key elements:**
- Unique ID (`counter-002`)
- Priority level (critical/high/medium/low)
- Test status (✅ covered, ⏳ partial, ❌ uncovered)

### 2. Implement the Component (Counter.tsx)

Standard React component:

```typescript
export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <div data-testid="count-value">{count}</div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

### 3. Write Tests with describeSpec (Counter.test.tsx)

Link tests to spec scenarios:

```typescript
import { describeSpec } from '@agentforge/testing-framework'

describeSpec({
  spec: 'examples/test-spec-example/spec.md',
  scenario: 'counter-002',
  requirement: 'Increment count',
  title: 'User clicks increment button',
  priority: 'critical'
}, () => {
  it('should increment count when clicking button', async () => {
    // Test implementation
  })
})
```

**Benefits:**
- Clear linkage: Test ↔ Spec Scenario
- Tracked in coverage reports
- AI agents can generate test stubs

### 4. Generate Coverage Report

```bash
cd ~/repos/agent-dev-cycle
yarn coverage:spec
```

**Output:**
```
============================================================
📊 Test-Spec Coverage Summary
============================================================
Total Specs:       1
Total Scenarios:   5
✅ Covered:        3
❌ Uncovered:      2
📈 Coverage:       60%
============================================================

📋 Per-Spec Coverage:
  counter            [████████████░░░░░░░░] 60% (3/5)

❌ Uncovered Scenarios (need tests):
     [counter] counter-004: Count can go negative
     [counter] counter-005: User clicks reset button
```

**Generated file:** `coverage.json`

```json
{
  "generatedAt": "2026-02-11T08:45:00.000Z",
  "summary": {
    "totalScenarios": 5,
    "coveredScenarios": 3,
    "coveragePercent": 60
  },
  "specs": [...]
}
```

## Running the Example

### 1. Run Tests

```bash
cd ~/repos/agent-dev-cycle
yarn test examples/test-spec-example/Counter.test.tsx
```

### 2. Generate Coverage

```bash
yarn coverage:spec
```

### 3. View Results

Check `coverage.json` for detailed coverage data.

## Exercise: Complete the Coverage

Try implementing tests for the uncovered scenarios:

### Scenario counter-004: Count can go negative

```typescript
describeSpec({
  spec: 'examples/test-spec-example/spec.md',
  scenario: 'counter-004',
  requirement: 'Decrement count',
  title: 'Count can go negative',
  priority: 'medium'
}, () => {
  it('should allow negative counts', async () => {
    const user = userEvent.setup()
    render(<Counter />)
    
    // TODO: Implement test
    // 1. Get count display and decrement button
    // 2. Verify initial count is 0
    // 3. Click decrement
    // 4. Verify count is -1
  })
})
```

### Scenario counter-005: User clicks reset button

```typescript
describeSpec({
  spec: 'examples/test-spec-example/spec.md',
  scenario: 'counter-005',
  requirement: 'Reset count',
  title: 'User clicks reset button',
  priority: 'medium'
}, () => {
  it('should reset count to zero', async () => {
    const user = userEvent.setup()
    render(<Counter />)
    
    // TODO: Implement test
    // 1. Increment count to 5
    // 2. Click reset button
    // 3. Verify count is 0
  })
})
```

After implementing, run:
```bash
yarn coverage:spec
```

You should see **100% coverage**! 🎉

## Key Takeaways

1. **Traceability**: Every test is linked to a spec scenario
2. **Coverage Tracking**: Automated reports show gaps
3. **AI-Friendly**: Clear patterns for test generation
4. **Non-Breaking**: Works alongside regular `describe()` tests
5. **Type-Safe**: TypeScript ensures correct metadata

## Next Steps

- Read the [full documentation](../../docs/test-spec-linkage.md)
- Explore the [architecture design](../../openspec/changes/test-spec-linkage/design.md)
- Apply to your own components
- Generate coverage reports regularly

---

**Questions?** Check the [troubleshooting guide](../../docs/test-spec-linkage.md#troubleshooting).
