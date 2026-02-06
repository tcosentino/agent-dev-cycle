import type { Scenario, ProjectionInputs } from './types'

const scenarios: Scenario[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Defensive positioning in a commoditizing market',
    marketCondition: 'AI tools commoditize rapidly. Devin drops to $10/mo. Price pressure intensifies. SMBs remain skeptical of AI quality.',
    color: 'purple',
    projections: {
      year1: 400000,
      year2: 900000,
      year3: 1800000
    },
    threats: [
      'Race to bottom on pricing',
      'Customer trust deficit',
      'Enterprise players enter SMB market'
    ],
    strategy: 'Premium positioning with white-glove service. Emphasize human oversight and quality guarantees. Target customers who value reliability over cost.'
  },
  {
    id: 'base',
    name: 'Base Case',
    description: 'Balanced growth in a maturing market',
    marketCondition: 'Steady 27% CAGR in AI dev tools. Moderate competition with clear differentiation opportunities. SMB adoption grows steadily.',
    color: 'orange',
    projections: {
      year1: 865000,
      year2: 2500000,
      year3: 6000000
    },
    threats: [
      'Factory.ai moves downmarket',
      'No-code platforms add AI features',
      'Talent acquisition challenges'
    ],
    strategy: 'Own the SMB segment through case studies and referrals. Balance automation with human touch. Build distribution through Ntiva channel.'
  },
  {
    id: 'optimistic',
    name: 'Optimistic',
    description: 'First-mover advantage in an accelerating market',
    marketCondition: 'AI capabilities accelerate faster than expected. SMB adoption surges as trust builds. Competitors struggle with quality.',
    color: 'green',
    projections: {
      year1: 1200000,
      year2: 4000000,
      year3: 12000000
    },
    threats: [
      'Scaling operations too fast',
      'Complacency from early success',
      'Quality degradation at scale'
    ],
    strategy: 'Aggressive automation investment. Expand team proactively. Consider geographic expansion or vertical specialization.'
  }
]

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  return `$${(value / 1000).toFixed(0)}K`
}

function determineActiveScenario(inputs: ProjectionInputs): Scenario['id'] {
  const { projectsPerMonth, avgProjectValue } = inputs
  const annualRevenue = projectsPerMonth * avgProjectValue * 12

  // Simple heuristic based on calculated annual revenue
  if (annualRevenue < 600000) return 'conservative'
  if (annualRevenue > 1000000) return 'optimistic'
  return 'base'
}

interface ScenarioCardsProps {
  currentInputs: ProjectionInputs
}

export function ScenarioCards({ currentInputs }: ScenarioCardsProps) {
  const activeScenario = determineActiveScenario(currentInputs)

  return (
    <div className="scenario-cards">
      {scenarios.map((scenario) => (
        <div
          key={scenario.id}
          className={`scenario-card scenario-${scenario.color} ${activeScenario === scenario.id ? 'active' : ''}`}
        >
          <div className="scenario-header">
            <div className="scenario-badge">{scenario.name}</div>
            {activeScenario === scenario.id && (
              <div className="scenario-indicator">Current trajectory</div>
            )}
          </div>

          <p className="scenario-description">{scenario.description}</p>

          <div className="scenario-section">
            <h4 className="scenario-section-title">Market Condition</h4>
            <p className="scenario-market">{scenario.marketCondition}</p>
          </div>

          <div className="scenario-section">
            <h4 className="scenario-section-title">Revenue Projections</h4>
            <div className="scenario-projections">
              <div className="scenario-projection">
                <span className="projection-year">Y1</span>
                <span className="projection-amount">{formatCurrency(scenario.projections.year1)}</span>
              </div>
              <div className="scenario-projection">
                <span className="projection-year">Y2</span>
                <span className="projection-amount">{formatCurrency(scenario.projections.year2)}</span>
              </div>
              <div className="scenario-projection">
                <span className="projection-year">Y3</span>
                <span className="projection-amount">{formatCurrency(scenario.projections.year3)}</span>
              </div>
            </div>
          </div>

          <div className="scenario-section">
            <h4 className="scenario-section-title">Key Threats</h4>
            <ul className="scenario-threats">
              {scenario.threats.map((threat, i) => (
                <li key={i}>{threat}</li>
              ))}
            </ul>
          </div>

          <div className="scenario-section">
            <h4 className="scenario-section-title">Response Strategy</h4>
            <p className="scenario-strategy">{scenario.strategy}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
