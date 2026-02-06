import { useMemo } from 'react'
import type { CostBreakdown } from './types'

interface UnitEconomicsChartProps {
  automationLevel: number
}

export function UnitEconomicsChart({ automationLevel }: UnitEconomicsChartProps) {
  const breakdown = useMemo((): CostBreakdown[] => {
    // Costs scale inversely with automation
    // At 20% automation: high human oversight
    // At 90% automation: minimal human oversight
    const automationFactor = (automationLevel - 20) / 70 // 0 to 1

    // AI compute: relatively stable (5-8%)
    const aiCompute = 5 + automationFactor * 3

    // Human oversight: scales down with automation (25% -> 5%)
    const humanOversight = 25 - automationFactor * 20

    // Infrastructure: stable (2-3%)
    const infrastructure = 2 + automationFactor * 1

    // Sales & marketing: stable (8-10%)
    const salesMarketing = 8 + automationFactor * 2

    // Calculate gross margin as remainder
    const totalCosts = aiCompute + humanOversight + infrastructure + salesMarketing
    const grossMargin = 100 - totalCosts

    return [
      { label: 'AI Compute', percentage: aiCompute, color: 'var(--accent-tertiary)' },
      { label: 'Human Oversight', percentage: humanOversight, color: 'var(--accent-pink)' },
      { label: 'Infrastructure', percentage: infrastructure, color: 'var(--accent-orange)' },
      { label: 'Sales & Marketing', percentage: salesMarketing, color: 'var(--discovery-color)' },
      { label: 'Gross Margin', percentage: grossMargin, color: 'var(--accent-green)' }
    ]
  }, [automationLevel])

  const grossMargin = breakdown.find(b => b.label === 'Gross Margin')?.percentage ?? 0

  return (
    <div className="unit-economics">
      <div className="economics-summary">
        <div className="economics-stat">
          <span className="stat-label">Gross Margin</span>
          <span className="stat-value green">{grossMargin.toFixed(0)}%</span>
        </div>
        <div className="economics-stat">
          <span className="stat-label">Automation Level</span>
          <span className="stat-value">{automationLevel}%</span>
        </div>
        <div className="economics-stat">
          <span className="stat-label">Avg Project ($25K)</span>
          <span className="stat-value green">${((25000 * grossMargin) / 100).toLocaleString()}</span>
          <span className="stat-sublabel">gross profit</span>
        </div>
      </div>

      <div className="economics-breakdown">
        <h4 className="breakdown-title">Cost Breakdown per Project</h4>
        <div className="breakdown-bars">
          {breakdown.map((item) => (
            <div key={item.label} className="breakdown-row">
              <div className="breakdown-label">{item.label}</div>
              <div className="breakdown-bar-container">
                <div
                  className={`breakdown-bar ${item.label === 'Gross Margin' ? 'margin-bar' : ''}`}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <div className="breakdown-value">{item.percentage.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="economics-context">
        <h4 className="context-title">Competitive Context</h4>
        <div className="context-grid">
          <div className="context-item">
            <span className="context-label">Traditional Agency</span>
            <span className="context-value">40-50% margin</span>
          </div>
          <div className="context-item">
            <span className="context-label">SaaS Average</span>
            <span className="context-value">70-80% margin</span>
          </div>
          <div className="context-item highlight">
            <span className="context-label">AgentForge Target</span>
            <span className="context-value">{grossMargin.toFixed(0)}% margin</span>
          </div>
        </div>
      </div>
    </div>
  )
}
