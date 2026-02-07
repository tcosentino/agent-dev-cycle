import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Nav } from './components/nav'
import { AgentWorkspaceDemo } from './components/agent-workspace'
import {
  ProjectionsPage,
  RevenueCalculator,
  ScenarioCards,
  UnitEconomicsChart,
  CompetitorMatrix
} from './components/projections'
import {
  PriorityBadge,
  TypeBadge,
  AssigneeBadge,
  PhaseBadge,
  AgentStatusBadge
} from '@agentforge/ui-components'
import type { ProjectionInputs } from './components/projections'
import type { TaskPriority, TaskType, AgentRole, AgentStatus } from './components/task-board/types'
import '@agentforge/ui-components/styles/tokens.css'
import './mockups.css'

const defaultInputs: ProjectionInputs = {
  projectsPerMonth: 6,
  avgProjectValue: 25000,
  automationLevel: 50,
  winRate: 25
}

function MockupsPage() {
  const [inputs, setInputs] = useState<ProjectionInputs>(defaultInputs)

  return (
    <>
      <Nav currentPage="components" />
      <div className="mockups-container">
        <header className="mockups-header">
          <h1>UI Mockups</h1>
          <p>Screen layouts and component compositions for AgentForge</p>
        </header>

        <nav className="mockups-nav">
          <div className="nav-group">
            <span className="nav-group-label">Screens</span>
            <a href="#workspace" className="nav-item">Agent Workspace</a>
            <a href="#projections" className="nav-item">Projections Dashboard</a>
          </div>
          <div className="nav-group">
            <span className="nav-group-label">Components</span>
            <a href="#projection-components" className="nav-item">Projection Components</a>
            <a href="#badges" className="nav-item">Badge Components</a>
          </div>
          <div className="nav-group">
            <span className="nav-group-label">Concepts</span>
            <a href="#team-panel" className="nav-item">Agent Team Panel</a>
            <a href="#project-card" className="nav-item">Project Overview</a>
            <a href="#test-results" className="nav-item">Test Results</a>
            <a href="#activity-log" className="nav-item">Activity Log</a>
            <a href="#entity-detail" className="nav-item">Entity Detail</a>
          </div>
          <div className="nav-group">
            <span className="nav-group-label">Responsive</span>
            <a href="#mobile" className="nav-item">Mobile Views</a>
          </div>
        </nav>

        {/* Agent Workspace - Full Screen Layout */}
        <section id="workspace" className="mockup-section mockup-full-width">
          <div className="mockup-label">
            <span className="label-tag">Full Screen</span>
            <h2>Agent Workspace</h2>
            <p>Combined chat and task board view with synchronized state</p>
          </div>
          <div className="mockup-frame frame-desktop">
            <div className="frame-header">
              <div className="frame-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="frame-title">workspace.agentforge.dev</div>
            </div>
            <div className="frame-content frame-workspace">
              <AgentWorkspaceDemo autoPlay loop loopDelay={4000} />
            </div>
          </div>
        </section>

        {/* Projections Dashboard - Full Page */}
        <section id="projections" className="mockup-section mockup-full-width">
          <div className="mockup-label">
            <span className="label-tag">Full Page</span>
            <h2>Business Projections Dashboard</h2>
            <p>Interactive financial modeling with scenarios and competitive analysis</p>
          </div>
          <div className="mockup-frame frame-desktop">
            <div className="frame-header">
              <div className="frame-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="frame-title">projections.agentforge.dev</div>
            </div>
            <div className="frame-content frame-scroll">
              <ProjectionsPage />
            </div>
          </div>
        </section>

        {/* Individual Components Grid */}
        <section id="projection-components" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Components</span>
            <h2>Projection Components</h2>
            <p>Individual building blocks from the projections dashboard</p>
          </div>

          <div className="components-grid">
            {/* Revenue Calculator */}
            <div className="component-card component-wide">
              <h3>Revenue Calculator</h3>
              <div className="component-content">
                <RevenueCalculator inputs={inputs} onChange={setInputs} />
              </div>
            </div>

            {/* Unit Economics Chart */}
            <div className="component-card">
              <h3>Unit Economics Chart</h3>
              <div className="component-content">
                <UnitEconomicsChart automationLevel={inputs.automationLevel} />
              </div>
            </div>

            {/* Competitor Matrix */}
            <div className="component-card component-wide">
              <h3>Competitor Matrix</h3>
              <div className="component-content">
                <CompetitorMatrix />
              </div>
            </div>

            {/* Scenario Cards */}
            <div className="component-card component-full">
              <h3>Scenario Cards</h3>
              <div className="component-content">
                <ScenarioCards currentInputs={inputs} />
              </div>
            </div>
          </div>
        </section>

        {/* Badge Components */}
        <section id="badges" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Atoms</span>
            <h2>Badge Components</h2>
            <p>Status indicators and visual tags used throughout the interface</p>
          </div>

          <div className="badge-showcase">
            {/* Priority Badges */}
            <div className="badge-group">
              <h4>Priority Badges</h4>
              <div className="badge-row">
                {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
                  <PriorityBadge key={p} priority={p} />
                ))}
              </div>
            </div>

            {/* Type Badges */}
            <div className="badge-group">
              <h4>Type Badges</h4>
              <div className="badge-row">
                {(['backend', 'frontend', 'api', 'database', 'testing'] as TaskType[]).map(t => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            </div>

            {/* Assignee Badges */}
            <div className="badge-group">
              <h4>Assignee Badges</h4>
              <div className="badge-row">
                {(['pm', 'engineer', 'qa', 'lead'] as AgentRole[]).map(r => (
                  <AssigneeBadge key={r} role={r} />
                ))}
              </div>
            </div>

            {/* Phase Badges */}
            <div className="badge-group">
              <h4>Phase Badges</h4>
              <div className="badge-row">
                <PhaseBadge phase="Discovery" />
                <PhaseBadge phase="PM Planning" />
                <PhaseBadge phase="Sprint 1" />
                <PhaseBadge phase="Sprint 2" />
                <PhaseBadge phase="QA Review" />
                <PhaseBadge phase="Deployed" />
              </div>
            </div>

            {/* Agent Status Badges */}
            <div className="badge-group">
              <h4>Agent Status Badges</h4>
              <div className="badge-row">
                {(['active', 'busy', 'away', 'offline'] as AgentStatus[]).map(s => (
                  <AgentStatusBadge key={s} status={s} />
                ))}
              </div>
              <div className="badge-row">
                <span className="badge-label">Sizes:</span>
                <AgentStatusBadge status="active" size="sm" />
                <AgentStatusBadge status="active" size="md" />
                <AgentStatusBadge status="active" size="lg" />
              </div>
              <div className="badge-row">
                <span className="badge-label">No Label:</span>
                {(['active', 'busy', 'away', 'offline'] as AgentStatus[]).map(s => (
                  <AgentStatusBadge key={s} status={s} showLabel={false} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Agent Team Panel Mockup */}
        <section id="team-panel" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Concept</span>
            <h2>Agent Team Panel</h2>
            <p>Proposed view showing all agents working on a project</p>
          </div>
          <div className="mockup-frame frame-sidebar">
            <div className="frame-header">
              <div className="frame-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="frame-title">Team Overview</div>
            </div>
            <div className="frame-content">
              <div className="agent-team-mockup">
                <div className="team-header">
                  <h4>Project Team</h4>
                  <span className="team-count">4 agents</span>
                </div>
                <div className="agent-list">
                  <div className="agent-item">
                    <AssigneeBadge role="pm" />
                    <div className="agent-info">
                      <span className="agent-name">Project Manager</span>
                      <span className="agent-task">Analyzing requirements</span>
                    </div>
                    <AgentStatusBadge status="busy" showLabel={false} size="sm" />
                  </div>
                  <div className="agent-item">
                    <AssigneeBadge role="lead" />
                    <div className="agent-info">
                      <span className="agent-name">Tech Lead</span>
                      <span className="agent-task">Reviewing architecture</span>
                    </div>
                    <AgentStatusBadge status="active" showLabel={false} size="sm" />
                  </div>
                  <div className="agent-item">
                    <AssigneeBadge role="engineer" />
                    <div className="agent-info">
                      <span className="agent-name">Engineer</span>
                      <span className="agent-task">Writing database schema</span>
                    </div>
                    <AgentStatusBadge status="busy" showLabel={false} size="sm" />
                  </div>
                  <div className="agent-item">
                    <AssigneeBadge role="qa" />
                    <div className="agent-info">
                      <span className="agent-name">QA Engineer</span>
                      <span className="agent-task">Waiting for tasks</span>
                    </div>
                    <AgentStatusBadge status="away" showLabel={false} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Overview Mockup */}
        <section id="project-card" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Concept</span>
            <h2>Project Overview Card</h2>
            <p>Summary view of a project in progress</p>
          </div>
          <div className="mockup-frame frame-card">
            <div className="project-card-mockup">
              <div className="project-header">
                <div className="project-key">BAAP-2026</div>
                <PhaseBadge phase="Sprint 1" />
              </div>
              <h3 className="project-name">Bay Area Auto Parts - Inventory System</h3>
              <p className="project-description">
                Custom inventory management with POS integration, automated reorder alerts,
                and multi-location stock tracking.
              </p>
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-value">4</span>
                  <span className="stat-label">Tasks</span>
                </div>
                <div className="stat">
                  <span className="stat-value">1</span>
                  <span className="stat-label">In Progress</span>
                </div>
                <div className="stat">
                  <span className="stat-value">2</span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>
              <div className="project-team-row">
                <span className="team-label">Team:</span>
                <div className="team-avatars">
                  <AssigneeBadge role="pm" />
                  <AssigneeBadge role="engineer" />
                  <AssigneeBadge role="qa" />
                </div>
              </div>
              <div className="project-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '50%' }}></div>
                </div>
                <span className="progress-label">50% complete</span>
              </div>
            </div>
          </div>
        </section>

        {/* Test Results View */}
        <section id="test-results" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Concept</span>
            <h2>Test Results Dashboard</h2>
            <p>Overview of test runs with pass/fail status and drill-down capability</p>
          </div>
          <div className="mockup-frame frame-wide">
            <div className="frame-header">
              <div className="frame-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="frame-title">tests.agentforge.dev/BAAP-2026</div>
            </div>
            <div className="frame-content">
              <div className="test-results-mockup">
                <div className="test-header">
                  <div className="test-title-row">
                    <h3>Test Results</h3>
                    <span className="test-run-id">Run #47</span>
                  </div>
                  <div className="test-summary">
                    <div className="test-stat pass">
                      <span className="test-stat-value">24</span>
                      <span className="test-stat-label">Passed</span>
                    </div>
                    <div className="test-stat fail">
                      <span className="test-stat-value">2</span>
                      <span className="test-stat-label">Failed</span>
                    </div>
                    <div className="test-stat skip">
                      <span className="test-stat-value">1</span>
                      <span className="test-stat-label">Skipped</span>
                    </div>
                    <div className="test-stat duration">
                      <span className="test-stat-value">3.2s</span>
                      <span className="test-stat-label">Duration</span>
                    </div>
                  </div>
                </div>

                <div className="test-suites">
                  <div className="test-suite">
                    <div className="suite-header">
                      <span className="suite-icon pass">&#10003;</span>
                      <span className="suite-name">ProductService.test.ts</span>
                      <span className="suite-stats">8/8 passed</span>
                      <span className="suite-time">0.8s</span>
                    </div>
                  </div>

                  <div className="test-suite expanded">
                    <div className="suite-header">
                      <span className="suite-icon fail">&#10007;</span>
                      <span className="suite-name">InventoryAPI.test.ts</span>
                      <span className="suite-stats">6/8 passed</span>
                      <span className="suite-time">1.2s</span>
                    </div>
                    <div className="suite-tests">
                      <div className="test-case pass">
                        <span className="case-icon">&#10003;</span>
                        <span className="case-name">should create new inventory item</span>
                        <span className="case-time">45ms</span>
                      </div>
                      <div className="test-case pass">
                        <span className="case-icon">&#10003;</span>
                        <span className="case-name">should update stock levels</span>
                        <span className="case-time">38ms</span>
                      </div>
                      <div className="test-case fail">
                        <span className="case-icon">&#10007;</span>
                        <span className="case-name">should handle concurrent updates</span>
                        <span className="case-time">156ms</span>
                      </div>
                      <div className="test-error">
                        <code>AssertionError: expected 150 to equal 148</code>
                        <span className="error-location">at InventoryAPI.test.ts:47:12</span>
                      </div>
                      <div className="test-case fail">
                        <span className="case-icon">&#10007;</span>
                        <span className="case-name">should rollback on transaction failure</span>
                        <span className="case-time">89ms</span>
                      </div>
                      <div className="test-error">
                        <code>TimeoutError: transaction did not complete within 5000ms</code>
                        <span className="error-location">at InventoryAPI.test.ts:72:8</span>
                      </div>
                    </div>
                  </div>

                  <div className="test-suite">
                    <div className="suite-header">
                      <span className="suite-icon pass">&#10003;</span>
                      <span className="suite-name">ReorderAlerts.test.ts</span>
                      <span className="suite-stats">10/10 passed</span>
                      <span className="suite-time">1.1s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Activity Log */}
        <section id="activity-log" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Concept</span>
            <h2>Agent Activity Log</h2>
            <p>Detailed timeline of agent actions, decisions, and outputs</p>
          </div>
          <div className="mockup-frame frame-wide">
            <div className="frame-header">
              <div className="frame-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="frame-title">logs.agentforge.dev/BAAP-2026</div>
            </div>
            <div className="frame-content">
              <div className="activity-log-mockup">
                <div className="log-filters">
                  <button className="log-filter active">All</button>
                  <button className="log-filter">Code</button>
                  <button className="log-filter">Decisions</button>
                  <button className="log-filter">API Calls</button>
                  <button className="log-filter">Errors</button>
                </div>

                <div className="log-entries">
                  <div className="log-entry">
                    <div className="log-time">14:32:18</div>
                    <div className="log-agent">
                      <AssigneeBadge role="engineer" />
                    </div>
                    <div className="log-content">
                      <div className="log-action">
                        <span className="action-type code">writeFile</span>
                        <span className="action-target">src/services/inventory.ts</span>
                      </div>
                      <div className="log-detail">Created InventoryService class with CRUD operations</div>
                    </div>
                  </div>

                  <div className="log-entry">
                    <div className="log-time">14:31:45</div>
                    <div className="log-agent">
                      <AssigneeBadge role="engineer" />
                    </div>
                    <div className="log-content">
                      <div className="log-action">
                        <span className="action-type decision">decision</span>
                        <span className="action-target">Architecture Choice</span>
                      </div>
                      <div className="log-detail">Using repository pattern for data access layer to maintain separation of concerns</div>
                      <div className="log-reasoning">
                        <span className="reasoning-label">Reasoning:</span>
                        Customer mentioned potential database migration in future. Repository pattern will make this easier.
                      </div>
                    </div>
                  </div>

                  <div className="log-entry">
                    <div className="log-time">14:30:22</div>
                    <div className="log-agent">
                      <AssigneeBadge role="pm" />
                    </div>
                    <div className="log-content">
                      <div className="log-action">
                        <span className="action-type api">apiCall</span>
                        <span className="action-target">OpenAI GPT-4</span>
                      </div>
                      <div className="log-detail">Analyzed customer requirements document</div>
                      <div className="log-metrics">
                        <span>Tokens: 2,847</span>
                        <span>Latency: 1.2s</span>
                        <span>Cost: $0.08</span>
                      </div>
                    </div>
                  </div>

                  <div className="log-entry error">
                    <div className="log-time">14:28:15</div>
                    <div className="log-agent">
                      <AssigneeBadge role="qa" />
                    </div>
                    <div className="log-content">
                      <div className="log-action">
                        <span className="action-type error">error</span>
                        <span className="action-target">Test Failure</span>
                      </div>
                      <div className="log-detail">InventoryAPI.test.ts: 2 tests failed</div>
                      <div className="log-stack">
                        <code>AssertionError: expected 150 to equal 148 at InventoryAPI.test.ts:47:12</code>
                      </div>
                    </div>
                  </div>

                  <div className="log-entry">
                    <div className="log-time">14:25:03</div>
                    <div className="log-agent">
                      <AssigneeBadge role="engineer" />
                    </div>
                    <div className="log-content">
                      <div className="log-action">
                        <span className="action-type code">runCommand</span>
                        <span className="action-target">npm test</span>
                      </div>
                      <div className="log-detail">Executed test suite: 24 passed, 2 failed, 1 skipped</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Entity Detail View */}
        <section id="entity-detail" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Concept</span>
            <h2>Entity Detail View</h2>
            <p>Deep dive into a specific artifact created by agents</p>
          </div>
          <div className="components-grid">
            {/* File Entity */}
            <div className="mockup-frame">
              <div className="frame-header">
                <div className="frame-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="frame-title">File Detail</div>
              </div>
              <div className="frame-content">
                <div className="entity-detail-mockup">
                  <div className="entity-header">
                    <div className="entity-icon file">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="entity-title">
                      <h4>inventory.ts</h4>
                      <span className="entity-path">src/services/inventory.ts</span>
                    </div>
                  </div>
                  <div className="entity-meta">
                    <div className="meta-item">
                      <span className="meta-label">Created by</span>
                      <AssigneeBadge role="engineer" />
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Task</span>
                      <span className="meta-value link">BAAP-2</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Lines</span>
                      <span className="meta-value">247</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Last modified</span>
                      <span className="meta-value">2 min ago</span>
                    </div>
                  </div>
                  <div className="entity-history">
                    <h5>Change History</h5>
                    <div className="history-item">
                      <span className="history-time">14:32</span>
                      <span className="history-action">Added transaction rollback</span>
                    </div>
                    <div className="history-item">
                      <span className="history-time">14:28</span>
                      <span className="history-action">Fixed concurrent update bug</span>
                    </div>
                    <div className="history-item">
                      <span className="history-time">14:15</span>
                      <span className="history-action">Initial creation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Entity */}
            <div className="mockup-frame">
              <div className="frame-header">
                <div className="frame-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="frame-title">Decision Detail</div>
              </div>
              <div className="frame-content">
                <div className="entity-detail-mockup">
                  <div className="entity-header">
                    <div className="entity-icon decision">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div className="entity-title">
                      <h4>Repository Pattern</h4>
                      <span className="entity-path">Architecture Decision</span>
                    </div>
                  </div>
                  <div className="entity-meta">
                    <div className="meta-item">
                      <span className="meta-label">Made by</span>
                      <AssigneeBadge role="lead" />
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Impact</span>
                      <span className="meta-value high">High</span>
                    </div>
                  </div>
                  <div className="decision-content">
                    <div className="decision-section">
                      <h5>Decision</h5>
                      <p>Use repository pattern for all data access operations</p>
                    </div>
                    <div className="decision-section">
                      <h5>Context</h5>
                      <p>Customer mentioned potential PostgreSQL to MongoDB migration in 6 months</p>
                    </div>
                    <div className="decision-section">
                      <h5>Alternatives Considered</h5>
                      <ul>
                        <li>Direct ORM usage - rejected due to tight coupling</li>
                        <li>Active Record - rejected due to testing complexity</li>
                      </ul>
                    </div>
                    <div className="decision-section">
                      <h5>Affected Files</h5>
                      <div className="affected-files">
                        <span className="file-link">src/repositories/*</span>
                        <span className="file-link">src/services/*</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Responsive Preview */}
        <section id="mobile" className="mockup-section">
          <div className="mockup-label">
            <span className="label-tag">Responsive</span>
            <h2>Mobile Views</h2>
            <p>How screens adapt to smaller viewports</p>
          </div>
          <div className="mobile-showcase">
            <div className="mockup-frame frame-mobile">
              <div className="frame-header frame-header-mobile">
                <div className="frame-notch"></div>
              </div>
              <div className="frame-content">
                <div className="mobile-project-list">
                  <div className="mobile-nav">
                    <span className="mobile-logo">AgentForge</span>
                    <span className="mobile-menu">Menu</span>
                  </div>
                  <h3>Your Projects</h3>
                  <div className="mobile-project-card">
                    <div className="mobile-card-header">
                      <span className="mobile-key">BAAP-2026</span>
                      <PhaseBadge phase="Sprint 1" />
                    </div>
                    <p className="mobile-card-title">Inventory System</p>
                    <div className="mobile-card-footer">
                      <span>4 tasks</span>
                      <span>50%</span>
                    </div>
                  </div>
                  <div className="mobile-project-card">
                    <div className="mobile-card-header">
                      <span className="mobile-key">TRX-2026</span>
                      <PhaseBadge phase="Discovery" />
                    </div>
                    <p className="mobile-card-title">Booking Platform</p>
                    <div className="mobile-card-footer">
                      <span>0 tasks</span>
                      <span>5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mockup-frame frame-mobile">
              <div className="frame-header frame-header-mobile">
                <div className="frame-notch"></div>
              </div>
              <div className="frame-content">
                <div className="mobile-chat-view">
                  <div className="mobile-chat-header">
                    <span className="back-arrow">Back</span>
                    <span className="channel-name">#project-baap</span>
                  </div>
                  <div className="mobile-messages">
                    <div className="mobile-message">
                      <AssigneeBadge role="pm" />
                      <div className="message-bubble">
                        <p>Starting analysis of customer requirements...</p>
                      </div>
                    </div>
                    <div className="mobile-message">
                      <AssigneeBadge role="engineer" />
                      <div className="message-bubble">
                        <p>Database schema is ready for review.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mobile-input">
                    <span>Type a message...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MockupsPage />
  </StrictMode>
)
