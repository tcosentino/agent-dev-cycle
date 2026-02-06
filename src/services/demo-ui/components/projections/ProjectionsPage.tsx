import { useState } from 'react'
import { RevenueCalculator } from './RevenueCalculator'
import { ScenarioCards } from './ScenarioCards'
import { UnitEconomicsChart } from './UnitEconomicsChart'
import { CompetitorMatrix } from './CompetitorMatrix'
import type { ProjectionInputs } from './types'
import './ProjectionsPage.css'

const defaultInputs: ProjectionInputs = {
  projectsPerMonth: 6,
  avgProjectValue: 25000,
  automationLevel: 50,
  winRate: 25
}

export function ProjectionsPage() {
  const [inputs, setInputs] = useState<ProjectionInputs>(defaultInputs)

  return (
    <div className="projections-page">
      <header className="projections-header">
        <div className="header-badge">Business Model Analysis</div>
        <h1>Revenue <span className="gradient-text">Projections</span></h1>
        <p className="header-subtitle">
          Adjust assumptions to explore different growth scenarios and competitive positioning
        </p>
      </header>

      <section className="projections-section calculator-section">
        <div className="section-inner">
          <RevenueCalculator inputs={inputs} onChange={setInputs} />
        </div>
      </section>

      <section className="projections-section scenarios-section">
        <div className="section-inner">
          <div className="section-header">
            <h2>Competitive Scenarios</h2>
            <p className="section-description">
              Three market scenarios based on competitor analysis and industry trends.
              Your current settings align with the highlighted scenario.
            </p>
          </div>
          <ScenarioCards currentInputs={inputs} />
        </div>
      </section>

      <section className="projections-section economics-section">
        <div className="section-inner">
          <div className="section-header">
            <h2>Unit Economics</h2>
            <p className="section-description">
              Cost structure breakdown showing how automation level affects gross margin.
            </p>
          </div>
          <UnitEconomicsChart automationLevel={inputs.automationLevel} />
        </div>
      </section>

      <section className="projections-section competitors-section">
        <div className="section-inner">
          <div className="section-header">
            <h2>Market Positioning</h2>
            <p className="section-description">
              How AgentForge compares to alternative solutions across key dimensions.
            </p>
          </div>
          <CompetitorMatrix />
        </div>
      </section>

      <section className="projections-section assumptions-section">
        <div className="section-inner">
          <div className="section-header">
            <h2>Key Assumptions</h2>
          </div>
          <div className="assumptions-grid">
            <div className="assumption-card">
              <h4>Market Growth</h4>
              <p>AI development platforms growing at 27% CAGR through 2032, reaching $30.1B TAM.</p>
            </div>
            <div className="assumption-card">
              <h4>Competitive Response</h4>
              <p>Devin and Factory.ai remain focused on developers/enterprise; SMB segment underserved.</p>
            </div>
            <div className="assumption-card">
              <h4>AI Capability</h4>
              <p>LLM performance continues improving; cost per token decreases 30-50% annually.</p>
            </div>
            <div className="assumption-card">
              <h4>Distribution</h4>
              <p>Ntiva channel provides warm leads; 300+ existing MSP customers as initial pipeline.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
