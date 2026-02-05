import { useMemo } from 'react'
import type { ProjectionInputs, ProjectionOutputs } from './types'

interface SliderConfig {
  key: keyof ProjectionInputs
  label: string
  min: number
  max: number
  step: number
  format: (value: number) => string
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'projectsPerMonth',
    label: 'Projects per Month',
    min: 1,
    max: 20,
    step: 1,
    format: (v) => `${v} projects`
  },
  {
    key: 'avgProjectValue',
    label: 'Average Project Value',
    min: 10000,
    max: 75000,
    step: 5000,
    format: (v) => `$${(v / 1000).toFixed(0)}K`
  },
  {
    key: 'automationLevel',
    label: 'Automation Level',
    min: 20,
    max: 90,
    step: 5,
    format: (v) => `${v}%`
  },
  {
    key: 'winRate',
    label: 'Win Rate vs Competitors',
    min: 10,
    max: 50,
    step: 5,
    format: (v) => `${v}%`
  }
]

function calculateProjections(inputs: ProjectionInputs): ProjectionOutputs {
  const { projectsPerMonth, avgProjectValue, automationLevel } = inputs

  // Monthly and annual revenue
  const monthlyRevenue = projectsPerMonth * avgProjectValue
  const annualRevenue = monthlyRevenue * 12

  // Gross margin scales with automation (60% at 20% automation, 85% at 90% automation)
  const grossMargin = 60 + ((automationLevel - 20) / 70) * 25
  const grossProfit = annualRevenue * (grossMargin / 100)

  // Year projections with growth assumptions
  // Year 1: Current run rate
  // Year 2: 2.5x growth (team scaling, brand awareness)
  // Year 3: 2x growth from Y2 (market penetration)
  const year1Revenue = annualRevenue
  const year2Revenue = annualRevenue * 2.5
  const year3Revenue = year2Revenue * 2

  return {
    monthlyRevenue,
    annualRevenue,
    grossMargin,
    grossProfit,
    year1Revenue,
    year2Revenue,
    year3Revenue
  }
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  return `$${(value / 1000).toFixed(0)}K`
}

interface RevenueCalculatorProps {
  inputs: ProjectionInputs
  onChange: (inputs: ProjectionInputs) => void
}

export function RevenueCalculator({ inputs, onChange }: RevenueCalculatorProps) {
  const outputs = useMemo(() => calculateProjections(inputs), [inputs])

  const handleSliderChange = (key: keyof ProjectionInputs, value: number) => {
    onChange({ ...inputs, [key]: value })
  }

  return (
    <div className="revenue-calculator">
      <div className="calculator-inputs">
        <h3 className="calculator-section-title">Adjust Assumptions</h3>
        {sliderConfigs.map((config) => (
          <div key={config.key} className="slider-group">
            <div className="slider-header">
              <label className="slider-label">{config.label}</label>
              <span className="slider-value">{config.format(inputs[config.key])}</span>
            </div>
            <input
              type="range"
              className="slider-input"
              min={config.min}
              max={config.max}
              step={config.step}
              value={inputs[config.key]}
              onChange={(e) => handleSliderChange(config.key, Number(e.target.value))}
            />
            <div className="slider-range">
              <span>{config.format(config.min)}</span>
              <span>{config.format(config.max)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="calculator-outputs">
        <h3 className="calculator-section-title">Projected Results</h3>
        <div className="output-grid">
          <div className="output-card">
            <div className="output-label">Monthly Revenue</div>
            <div className="output-value">{formatCurrency(outputs.monthlyRevenue)}</div>
          </div>
          <div className="output-card">
            <div className="output-label">Annual Revenue</div>
            <div className="output-value highlight">{formatCurrency(outputs.annualRevenue)}</div>
          </div>
          <div className="output-card">
            <div className="output-label">Gross Margin</div>
            <div className="output-value green">{outputs.grossMargin.toFixed(0)}%</div>
          </div>
          <div className="output-card">
            <div className="output-label">Annual Gross Profit</div>
            <div className="output-value green">{formatCurrency(outputs.grossProfit)}</div>
          </div>
        </div>

        <div className="year-projections">
          <h4 className="projections-subtitle">3-Year Revenue Trajectory</h4>
          <div className="projection-bars">
            <div className="projection-bar-group">
              <div className="projection-bar-label">Year 1</div>
              <div className="projection-bar-container">
                <div
                  className="projection-bar year1"
                  style={{ width: `${(outputs.year1Revenue / outputs.year3Revenue) * 100}%` }}
                />
              </div>
              <div className="projection-bar-value">{formatCurrency(outputs.year1Revenue)}</div>
            </div>
            <div className="projection-bar-group">
              <div className="projection-bar-label">Year 2</div>
              <div className="projection-bar-container">
                <div
                  className="projection-bar year2"
                  style={{ width: `${(outputs.year2Revenue / outputs.year3Revenue) * 100}%` }}
                />
              </div>
              <div className="projection-bar-value">{formatCurrency(outputs.year2Revenue)}</div>
            </div>
            <div className="projection-bar-group">
              <div className="projection-bar-label">Year 3</div>
              <div className="projection-bar-container">
                <div className="projection-bar year3" style={{ width: '100%' }} />
              </div>
              <div className="projection-bar-value">{formatCurrency(outputs.year3Revenue)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
