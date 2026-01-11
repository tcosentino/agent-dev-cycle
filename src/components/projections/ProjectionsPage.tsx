import { useState } from 'react'
import './projections.css'

type PathType = 'internal' | 'bootstrap' | 'investment'

interface Milestone {
  title: string
  description: string
  timeline: string
  cost?: string
}

interface PathData {
  id: PathType
  title: string
  subtitle: string
  icon: string
  color: string
  pros: string[]
  cons: string[]
  milestones: Milestone[]
  financials: {
    startup: string
    runway: string
    revenue12mo: string
    ownership: string
  }
}

const paths: PathData[] = [
  {
    id: 'internal',
    title: 'Internal Pitch',
    subtitle: 'Build within Ntiva',
    icon: '🏢',
    color: 'var(--accent-tertiary)',
    pros: [
      'Immediate access to 300+ MSP customers',
      'Existing Contuit infrastructure (12+ months head start)',
      'Steady salary while building',
      'Built-in support & sales team',
      'Lower personal financial risk',
    ],
    cons: [
      'Limited equity upside (revenue share vs ownership)',
      'Corporate approval processes',
      'Competing priorities with existing business',
      'May need to compromise on vision',
      'Exit options more complex',
    ],
    milestones: [
      { title: 'Internal Pitch', description: 'Present business case to leadership', timeline: 'Week 1-2' },
      { title: 'Pilot Approval', description: 'Get sign-off for 3 pilot projects', timeline: 'Week 3-4' },
      { title: 'First Pilots', description: 'Complete 3 projects with existing customers', timeline: 'Month 2-3' },
      { title: 'Revenue Share Agreement', description: 'Negotiate formal compensation structure', timeline: 'Month 3-4' },
      { title: 'Scale Operations', description: 'Expand to 10+ projects/quarter', timeline: 'Month 6-12' },
    ],
    financials: {
      startup: '$0 (company funded)',
      runway: 'Indefinite (salary continues)',
      revenue12mo: '$400-800K (company revenue)',
      ownership: '15-25% revenue share',
    },
  },
  {
    id: 'bootstrap',
    title: 'Bootstrap',
    subtitle: 'Build independently',
    icon: '🔧',
    color: 'var(--accent-green)',
    pros: [
      '100% ownership and control',
      'Full creative freedom',
      'Keep all upside',
      'Can pivot quickly',
      'Build exactly what you want',
    ],
    cons: [
      'No salary while building (need runway)',
      'Must find customers from scratch',
      'All infrastructure costs on you',
      'Slower go-to-market without distribution',
      'Higher personal financial risk',
    ],
    milestones: [
      { title: 'MVP Development', description: 'Build core agent system with Claude Code', timeline: 'Month 1-4', cost: '$2-4K' },
      { title: 'First Paying Customer', description: 'Complete 1 real project for money', timeline: 'Month 4-5', cost: '$500' },
      { title: 'Product-Market Fit', description: '5-10 customers, word-of-mouth referrals', timeline: 'Month 6-9', cost: '$2-3K' },
      { title: 'Ramen Profitable', description: '$5-10K MRR covering basic expenses', timeline: 'Month 9-12', cost: '$3-5K' },
      { title: 'Growth Mode', description: 'Hire first contractor, scale to $20K+ MRR', timeline: 'Month 12-18', cost: '$5-10K' },
    ],
    financials: {
      startup: '$2-4K (MVP development)',
      runway: 'Need 6-12 months living expenses',
      revenue12mo: '$50-150K (yours)',
      ownership: '100%',
    },
  },
  {
    id: 'investment',
    title: 'Raise Investment',
    subtitle: 'Pre-seed / Angel round',
    icon: '💰',
    color: 'var(--accent-primary)',
    pros: [
      'Capital to hire and move fast',
      'Investor network and advice',
      'Validation and credibility',
      'Can compete with funded competitors',
      'Potential for bigger outcome',
    ],
    cons: [
      'Dilution (give up 15-25% equity)',
      'Investor expectations and pressure',
      'Need to show traction first',
      'Fundraising is time-consuming',
      'Board/reporting obligations',
    ],
    milestones: [
      { title: 'Build MVP', description: 'Working product with 2-3 agents', timeline: 'Month 1-4', cost: '$2-4K' },
      { title: 'Get Traction', description: '3-5 paying customers, $10-20K revenue', timeline: 'Month 4-6', cost: '$2-3K' },
      { title: 'Pitch Deck & Materials', description: 'Prepare investor materials', timeline: 'Month 6-7', cost: '$500' },
      { title: 'Angel/Pre-seed Raise', description: 'Raise $300-500K at $2-3M valuation', timeline: 'Month 7-9', cost: 'Legal ~$5K' },
      { title: 'Scale with Capital', description: 'Hire team, aggressive growth', timeline: 'Month 9-18', cost: '$300-500K raised' },
    ],
    financials: {
      startup: '$2-4K (pre-investment)',
      runway: '$300-500K (12-18 months)',
      revenue12mo: '$100-300K',
      ownership: '75-85% (post-dilution)',
    },
  },
]

export function ProjectionsPage() {
  const [activePath, setActivePath] = useState<PathType>('internal')
  const currentPath = paths.find(p => p.id === activePath)!

  return (
    <div className="projections-page">
      <header className="projections-header">
        <h1>Strategic Paths</h1>
        <p>Three ways to bring AgentForge to market. Each has different tradeoffs.</p>
      </header>

      <div className="path-selector">
        {paths.map(path => (
          <button
            key={path.id}
            className={`path-tab ${activePath === path.id ? 'active' : ''}`}
            onClick={() => setActivePath(path.id)}
            style={{ '--path-color': path.color } as React.CSSProperties}
          >
            <span className="path-icon">{path.icon}</span>
            <div className="path-tab-text">
              <span className="path-tab-title">{path.title}</span>
              <span className="path-tab-subtitle">{path.subtitle}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="path-content">
        <div className="path-grid">
          {/* Pros & Cons */}
          <section className="pros-cons-section">
            <div className="pros-card">
              <h3>✓ Advantages</h3>
              <ul>
                {currentPath.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>
            <div className="cons-card">
              <h3>✗ Challenges</h3>
              <ul>
                {currentPath.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Milestones */}
          <section className="milestones-section">
            <h3>Key Milestones</h3>
            <div className="milestones-timeline">
              {currentPath.milestones.map((milestone, i) => (
                <div key={i} className="milestone-item">
                  <div className="milestone-marker" style={{ '--path-color': currentPath.color } as React.CSSProperties}>
                    {i + 1}
                  </div>
                  <div className="milestone-content">
                    <div className="milestone-header">
                      <h4>{milestone.title}</h4>
                      <span className="milestone-timeline">{milestone.timeline}</span>
                    </div>
                    <p>{milestone.description}</p>
                    {milestone.cost && <span className="milestone-cost">{milestone.cost}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Financials */}
          <section className="financials-section">
            <h3>Financial Summary</h3>
            <div className="financials-grid">
              <div className="financial-card">
                <span className="financial-label">Startup Cost</span>
                <span className="financial-value">{currentPath.financials.startup}</span>
              </div>
              <div className="financial-card">
                <span className="financial-label">Runway Needed</span>
                <span className="financial-value">{currentPath.financials.runway}</span>
              </div>
              <div className="financial-card">
                <span className="financial-label">12-Month Revenue</span>
                <span className="financial-value">{currentPath.financials.revenue12mo}</span>
              </div>
              <div className="financial-card highlight" style={{ '--path-color': currentPath.color } as React.CSSProperties}>
                <span className="financial-label">Your Ownership</span>
                <span className="financial-value">{currentPath.financials.ownership}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Comparison Table */}
        <section className="comparison-section">
          <h3>Quick Comparison</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                {paths.map(p => (
                  <th key={p.id} style={{ color: p.color }}>{p.icon} {p.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Time to Revenue</td>
                <td>2-3 months</td>
                <td>4-6 months</td>
                <td>6-9 months</td>
              </tr>
              <tr>
                <td>Personal Risk</td>
                <td>Low</td>
                <td>High</td>
                <td>Medium</td>
              </tr>
              <tr>
                <td>Upside Potential</td>
                <td>Medium (revenue share)</td>
                <td>High (100% ownership)</td>
                <td>Highest (VC scale)</td>
              </tr>
              <tr>
                <td>Control</td>
                <td>Limited</td>
                <td>Full</td>
                <td>Shared with investors</td>
              </tr>
              <tr>
                <td>Best If You...</td>
                <td>Want stability + upside</td>
                <td>Want full control</td>
                <td>Want to go big or go home</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Recommendation */}
        <section className="recommendation-section">
          <h3>Suggested Approach</h3>
          <div className="recommendation-card">
            <p>
              <strong>Start with Bootstrap, keep Internal as backup.</strong>
            </p>
            <p>
              Build the MVP on nights/weekends using Claude Code ($200/mo). Get 2-3 paying customers
              to validate the model. This gives you leverage for either path:
            </p>
            <ul>
              <li><strong>If it works:</strong> You have options — raise investment, pitch internally with proof, or keep growing independently</li>
              <li><strong>If customers are hard to find:</strong> Pitch internally where you have built-in distribution</li>
              <li><strong>If internal says no:</strong> You already have a product and can pursue other paths</li>
            </ul>
            <p className="recommendation-note">
              The worst outcome is pitching internally without proof and getting a "not now."
              Build something real first — it changes every conversation.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
