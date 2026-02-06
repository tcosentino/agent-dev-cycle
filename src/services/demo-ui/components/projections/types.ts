export interface ProjectionInputs {
  projectsPerMonth: number
  avgProjectValue: number
  automationLevel: number  // 0-100, affects gross margin
  winRate: number          // 0-100, market win rate
}

export interface ProjectionOutputs {
  monthlyRevenue: number
  annualRevenue: number
  grossMargin: number
  grossProfit: number
  year1Revenue: number
  year2Revenue: number
  year3Revenue: number
}

export interface Scenario {
  id: 'conservative' | 'base' | 'optimistic'
  name: string
  description: string
  marketCondition: string
  color: string
  projections: {
    year1: number
    year2: number
    year3: number
  }
  threats: string[]
  strategy: string
}

export interface Competitor {
  id: string
  name: string
  price: string
  timeline: string
  customization: string
  targetCustomer: string
  highlight?: boolean
}

export interface CostBreakdown {
  label: string
  percentage: number
  color: string
}
