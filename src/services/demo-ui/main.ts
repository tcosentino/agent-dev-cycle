import './style.css'
import '@agentforge/ui-components/styles/tokens.css'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { TaskBoardDemo } from './components/task-board'
import { ProjectionsPage } from './components/projections'

// Render the HTML content
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="noise-overlay"></div>

  <nav>
    <div class="logo" id="logo-demo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      AgentForge
    </div>
    <div class="nav-steps">
      <button class="nav-step" id="nav-demo">Demo</button>
      <button class="nav-step doc-link" id="nav-docs">Design Doc</button>
      <button class="nav-step" id="nav-projections">Projections</button>
      <div class="nav-dropdown">
        <button class="nav-step" id="nav-components">Components <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-icon"><polyline points="6 9 12 15 18 9"/></svg></button>
        <div class="nav-dropdown-menu" id="components-menu">
          <a href="/component-preview.html" class="nav-dropdown-item">Task Board</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- ==================== DEMO PAGE ==================== -->
  <div id="demo-page" class="page active">
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-badge"><span class="badge-dot"></span>AI-Powered Development Platform</div>
      <h1>Your AI <span class="gradient-text">Engineering Team</span></h1>
      <p class="hero-subtitle">Watch a complete development team collaborate to transform your requirements into production-ready software. PM, Engineers, QA — all working together.</p>
      <div class="hero-cta">
        <a href="#team" class="btn btn-primary">Meet the Team</a>
        <button class="btn btn-secondary" id="hero-docs-btn">Read Design Doc</button>
      </div>
    </section>

    <section id="team" class="team-roster">
      <div class="roster-container">
        <div class="roster-label">Your AI Team</div>
        <h2 class="roster-title">8 Specialized Agents Across 4 Phases</h2>
        <p class="roster-subtitle">Our methodology synthesizes best practices from Amazon, Basecamp, Google, and IDEO into a proven development flow.</p>

        <div class="phase-group">
          <div class="phase-label discovery">Phase 1: Discovery</div>
          <div class="roster-grid">
            <div class="roster-card">
              <div class="roster-avatar planning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
              <div class="roster-name">Planning Agent</div>
              <div class="roster-role">Problem extraction & PR/FAQ</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
            <div class="roster-card">
              <div class="roster-avatar research"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
              <div class="roster-name">Research Agent</div>
              <div class="roster-role">Market & technical research</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
          </div>
        </div>

        <div class="phase-group">
          <div class="phase-label shaping">Phase 2: Shaping</div>
          <div class="roster-grid">
            <div class="roster-card">
              <div class="roster-avatar planning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
              <div class="roster-name">Planning Agent</div>
              <div class="roster-role">Scope & pitch documents</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
            <div class="roster-card">
              <div class="roster-avatar ux"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></div>
              <div class="roster-name">UX Agent</div>
              <div class="roster-role">Interaction flows & prototypes</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
            <div class="roster-card">
              <div class="roster-avatar coding"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
              <div class="roster-name">Coding Agent</div>
              <div class="roster-role">Technical feasibility</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
          </div>
        </div>

        <div class="phase-group">
          <div class="phase-label building">Phase 3: Building</div>
          <div class="roster-grid">
            <div class="roster-card">
              <div class="roster-avatar coding"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
              <div class="roster-name">Coding Agent</div>
              <div class="roster-role">Vertical slice implementation</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
            <div class="roster-card">
              <div class="roster-avatar review"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
              <div class="roster-name">Review Agent</div>
              <div class="roster-role">Code review & security</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
            <div class="roster-card">
              <div class="roster-avatar testing"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <div class="roster-name">Testing Agent</div>
              <div class="roster-role">Unit & integration tests</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
          </div>
        </div>

        <div class="phase-group">
          <div class="phase-label delivery">Phase 4: Delivery</div>
          <div class="roster-grid">
            <div class="roster-card">
              <div class="roster-avatar devops"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg></div>
              <div class="roster-name">DevOps Agent</div>
              <div class="roster-role">CI/CD & deployment</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
            <div class="roster-card">
              <div class="roster-avatar monitoring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
              <div class="roster-name">Monitoring Agent</div>
              <div class="roster-role">Metrics & feedback loops</div>
              <div class="roster-status"><span class="status-dot"></span>Online</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="discovery" class="step-section">
      <div class="section-container">
        <div class="step-content">
          <div class="step-info">
            <div class="step-number">PHASE 01</div>
            <h2 class="step-title">Discovery</h2>
            <p class="step-description">Understand the problem deeply before jumping to solutions. Planning and Research agents collaborate to extract requirements, draft PR/FAQs, and define success metrics.</p>
            <ul class="step-features">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Problem extraction vs symptoms</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Amazon-style PR/FAQ drafting</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Competitive & market research</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Measurable success criteria</li>
            </ul>
            <a href="#shaping" class="step-nav-btn">Next: Shaping <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div class="demo-panel">
            <div class="demo-header">
              <span class="demo-dot red"></span><span class="demo-dot yellow"></span><span class="demo-dot green"></span>
              <span class="demo-title">#project-baap-inventory</span>
            </div>
            <div class="demo-body">
              <div class="chat-container">
                <div class="chat-channel-header">
                  <div class="channel-name"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>project-baap-inventory</div>
                  <div class="channel-members">
                    <div class="channel-member planning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
                    <div class="channel-member research"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
                  </div>
                </div>
                <div class="chat-message">
                  <div class="chat-avatar planning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
                  <div class="chat-content">
                    <div class="chat-header"><span class="chat-name planning">Planning Agent</span><span class="chat-time">9:00 AM</span></div>
                    <div class="chat-text">New project: Bay Area Auto Parts needs inventory management. Let me extract the core problem from the customer transcript...</div>
                  </div>
                </div>
                <div class="chat-message">
                  <div class="chat-avatar planning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
                  <div class="chat-content">
                    <div class="chat-header"><span class="chat-name planning">Planning Agent</span><span class="chat-time">9:01 AM</span></div>
                    <div class="chat-text">Core problem: Manual inventory tracking causing stockouts and lost sales. Customer: auto parts retailer with 3 locations.</div>
                    <div class="chat-action"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Drafted problem statement</div>
                  </div>
                </div>
                <div class="chat-message">
                  <div class="chat-avatar research"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
                  <div class="chat-content">
                    <div class="chat-header"><span class="chat-name research">Research Agent</span><span class="chat-time">9:02 AM</span></div>
                    <div class="chat-text">Researching competitive landscape. Found 3 existing solutions: Lightspeed, Cin7, Sortly. Key gap: none offer auto parts-specific catalog integration.</div>
                  </div>
                </div>
                <div class="chat-message">
                  <div class="chat-avatar planning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
                  <div class="chat-content">
                    <div class="chat-header"><span class="chat-name planning">Planning Agent</span><span class="chat-time">9:03 AM</span></div>
                    <div class="chat-text">Drafting PR/FAQ now. Headline: "Bay Area Auto Parts eliminates stockouts with real-time inventory tracking." Success metric: reduce stockouts by 80%.</div>
                    <div class="chat-action"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Created PR/FAQ draft</div>
                  </div>
                </div>
                <div class="chat-message">
                  <div class="chat-avatar research"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
                  <div class="chat-content">
                    <div class="chat-header"><span class="chat-name research">Research Agent</span><span class="chat-time">9:04 AM</span></div>
                    <div class="chat-text">Technical scan complete. Barcode scanning via mobile is mature. Real-time sync requires WebSocket. Recommend PostgreSQL for inventory transactions.</div>
                  </div>
                </div>
                <div class="typing-indicator">
                  <div class="chat-avatar planning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
                  <div class="typing-dots"><span></span><span></span><span></span></div>
                  <span class="typing-text">Planning Agent is typing...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="shaping" class="step-section">
      <div class="section-container">
        <div class="step-content">
          <div class="step-info">
            <div class="step-number">PHASE 02</div>
            <h2 class="step-title">Shaping</h2>
            <p class="step-description">Define the solution at the right level of abstraction. Planning, UX, and Coding agents collaborate to set appetite, identify risks, and create the pitch document.</p>
            <ul class="step-features">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Fixed time, variable scope (Shape Up)</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Rabbit hole identification</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Technical feasibility spikes</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Interaction flow prototypes</li>
            </ul>
            <a href="#building" class="step-nav-btn">Next: Building <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div class="demo-panel">
            <div class="demo-header">
              <span class="demo-dot red"></span><span class="demo-dot yellow"></span><span class="demo-dot green"></span>
              <span class="demo-title">project_board.view</span>
            </div>
            <div class="demo-body">
              <div id="task-board-demo-root"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="building" class="step-section">
      <div class="section-container">
        <div class="step-content">
          <div class="step-info">
            <div class="step-number">PHASE 03</div>
            <h2 class="step-title">Building</h2>
            <p class="step-description">Build the solution within fixed time, adjusting scope as needed. Coding, Review, and Testing agents work in tight loops to deliver working software.</p>
            <ul class="step-features">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Vertical slice implementation</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Continuous code review & security</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Automated testing with feedback loops</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Scope hammering when needed</li>
            </ul>
            <a href="#delivery" class="step-nav-btn">Next: Delivery <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div class="demo-panel">
            <div class="demo-header">
              <span class="demo-dot red"></span><span class="demo-dot yellow"></span><span class="demo-dot green"></span>
              <span class="demo-title">build_output.stream</span>
            </div>
            <div class="demo-body">
              <div class="build-container">
                <div class="build-header">
                  <div class="build-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Build Pipeline Active</div>
                  <div class="build-progress"><div class="progress-bar"><div class="progress-fill"></div></div><span class="progress-text">Building...</span></div>
                </div>
                <div class="artifact-grid">
                  <div class="artifact-card">
                    <div class="artifact-icon api"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg></div>
                    <div class="artifact-name">Product API</div>
                    <div class="artifact-type">REST Endpoint</div>
                    <div class="artifact-status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Created</div>
                  </div>
                  <div class="artifact-card">
                    <div class="artifact-icon job"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                    <div class="artifact-name">Reorder Alert Job</div>
                    <div class="artifact-type">Background Task</div>
                    <div class="artifact-status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Created</div>
                  </div>
                  <div class="artifact-card">
                    <div class="artifact-icon db"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
                    <div class="artifact-name">Inventory Schema</div>
                    <div class="artifact-type">Database Model</div>
                    <div class="artifact-status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Created</div>
                  </div>
                  <div class="artifact-card">
                    <div class="artifact-icon ui"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
                    <div class="artifact-name">POS Dashboard</div>
                    <div class="artifact-type">UI Component</div>
                    <div class="artifact-status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="delivery" class="step-section">
      <div class="section-container">
        <div class="step-content">
          <div class="step-info">
            <div class="step-number">PHASE 04</div>
            <h2 class="step-title">Delivery</h2>
            <p class="step-description">Ship to users and learn from real-world usage. DevOps and Monitoring agents handle deployment, track metrics, and feed insights back into the next discovery cycle.</p>
            <ul class="step-features">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Staged rollout with feature flags</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Real-time monitoring & alerts</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Usage analytics & A/B testing</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Feedback loop to next cycle</li>
            </ul>
            <a href="#mvp" class="step-nav-btn">See Roadmap <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div class="demo-panel">
            <div class="demo-header">
              <span class="demo-dot red"></span><span class="demo-dot yellow"></span><span class="demo-dot green"></span>
              <span class="demo-title">deployment_complete.log</span>
            </div>
            <div class="demo-body">
              <div class="delivery-container">
                <div class="delivery-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                <div class="delivery-title">Application Deployed Successfully</div>
                <div class="delivery-subtitle">Bay Area Auto Parts Inventory System is live</div>
                <div class="delivery-stats">
                  <div class="delivery-stat"><div class="delivery-stat-value">6 weeks</div><div class="delivery-stat-label">Full Cycle</div></div>
                  <div class="delivery-stat"><div class="delivery-stat-value">47</div><div class="delivery-stat-label">Tests Passing</div></div>
                  <div class="delivery-stat"><div class="delivery-stat-value">8</div><div class="delivery-stat-label">Agents Involved</div></div>
                </div>
                <div class="delivery-metrics">
                  <div class="metrics-header"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Monitoring Agent Active</div>
                  <div class="metrics-grid">
                    <div class="metric-item"><span class="metric-label">Uptime</span><span class="metric-value">99.9%</span></div>
                    <div class="metric-item"><span class="metric-label">Avg Response</span><span class="metric-value">142ms</span></div>
                    <div class="metric-item"><span class="metric-label">Daily Users</span><span class="metric-value">23</span></div>
                    <div class="metric-item"><span class="metric-label">Errors</span><span class="metric-value">0</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="mvp" class="mvp-section">
      <div class="section-container">
        <div class="section-label">Implementation Roadmap</div>
        <h2 class="section-title">Full Vision vs. MVP</h2>
        <p class="section-subtitle">We'll start with a human-assisted approach that generates revenue immediately, then gradually increase automation as the system proves itself.</p>
        <div class="mvp-comparison">
          <div class="mvp-card">
            <div class="mvp-card-header">
              <div class="mvp-card-icon vision"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
              <div><div class="mvp-card-title">Full Vision</div><div class="mvp-card-subtitle">Fully autonomous pipeline</div></div>
            </div>
            <ul class="mvp-features">
              <li><svg class="feature-icon auto" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>AI handles customer meetings</strong> — PM conducts discovery calls and extracts requirements</span></li>
              <li><svg class="feature-icon auto" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>Fully automated planning</strong> — Complete project breakdown with no human input</span></li>
              <li><svg class="feature-icon auto" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>Autonomous build + test cycles</strong> — Team iterates until all tests pass</span></li>
              <li><svg class="feature-icon auto" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>Direct customer interaction</strong> — PM asks clarifying questions async</span></li>
              <li><svg class="feature-icon auto" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>Auto-deployment</strong> — Production delivery with zero human intervention</span></li>
            </ul>
          </div>
          <div class="mvp-card highlighted">
            <div class="mvp-card-header">
              <div class="mvp-card-icon mvp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
              <div><div class="mvp-card-title">MVP (Phase 1)</div><div class="mvp-card-subtitle">Human-assisted AI development</div></div>
            </div>
            <ul class="mvp-features">
              <li><svg class="feature-icon human" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>Human runs customer meetings</strong> — Sales team handles discovery, AI transcribes</span></li>
              <li><svg class="feature-icon auto" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>PM suggests task breakdown</strong> — Human reviews and adjusts plan</span></li>
              <li><svg class="feature-icon auto" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>AI-assisted building</strong> — Engineers build with human checkpoints</span></li>
              <li><svg class="feature-icon human" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>Human manages customer comms</strong> — Team relays questions and feedback</span></li>
              <li><svg class="feature-icon human" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg><span class="feature-text"><strong>Human QA before delivery</strong> — Final testing and deployment approval</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="footer-cta">
      <h2>Ready to Build the Future?</h2>
      <p>This is just the beginning. Let's discuss how to bring this vision to life.</p>
      <button class="btn btn-primary" id="footer-docs-btn">Read Full Design Doc</button>
    </section>
  </div>

  <!-- ==================== DOCUMENT PAGE ==================== -->
  <div id="docs-page" class="page doc-page">
    <div class="doc-container">
      <div class="doc-header">
        <h1>AgentForge</h1>
        <div class="subtitle">AI-Powered Custom Software Development</div>
        <div class="meta">Business & Product Design Document | January 2026 | Confidential</div>
      </div>

      <div class="doc-content">
        <h2>Executive Summary</h2>
        <p>AgentForge is an AI multi-agent system that builds custom software for SMB customers. By orchestrating specialized AI agents—Product Manager, Engineers, QA, and Tech Lead—we can deliver production-ready applications in days instead of months, at a fraction of traditional development costs.</p>
        <p>The system fills a critical gap in the market: <strong>no-code tools are too limited</strong> (can't handle real backends, complex integrations, or custom UIs), while <strong>traditional dev shops are too slow and expensive</strong> for SMB budgets.</p>
        <p>We propose a phased approach: start with a <strong>human-assisted MVP</strong> that generates revenue immediately while proving reliability, then gradually increase automation as the system demonstrates consistent quality.</p>

        <div class="doc-metrics">
          <div class="doc-metric">
            <div class="doc-metric-label">Build Time</div>
            <div class="doc-metric-value blue">Days vs Months</div>
          </div>
          <div class="doc-metric">
            <div class="doc-metric-label">Cost Reduction</div>
            <div class="doc-metric-value green">60-80%</div>
          </div>
          <div class="doc-metric">
            <div class="doc-metric-label">Target Market</div>
            <div class="doc-metric-value purple">SMB Custom Apps</div>
          </div>
        </div>

        <h2>The Problem</h2>
        <h3>SMBs Need Custom Software, But Current Options Fail Them</h3>
        <p>Small and medium businesses increasingly need custom software to compete, but they're stuck between bad options:</p>
        <ul>
          <li><strong>No-code/Low-code tools</strong> (Bubble, Retool, Airtable) — Great for simple apps, but hit walls with complex business logic, real backends, custom UIs, or integrations beyond their plugin ecosystem.</li>
          <li><strong>Traditional dev shops</strong> — Quality code, but $50-200K projects with 3-6 month timelines price out most SMBs. Communication overhead and scope creep make small projects economically unfeasible.</li>
          <li><strong>Offshore development</strong> — Lower costs but requires technical project management skills most SMBs lack. Quality and communication issues are common.</li>
          <li><strong>AI coding assistants</strong> (Cursor, GitHub Copilot) — Powerful for developers, but useless for non-technical business owners who can't evaluate or deploy the output.</li>
        </ul>

        <h3>The Gap</h3>
        <p>There's no solution for: "I need a $10-50K custom application with real backend logic, built in 1-2 weeks, that I can explain in plain English."</p>
        <p>This is the gap AgentForge fills.</p>

        <h2>The Solution: AgentForge</h2>
        <h3>A Research-Backed Development Methodology</h3>
        <p>AgentForge synthesizes proven methodologies from industry leaders—Amazon's Working Backwards, Basecamp's Shape Up, Google's Design Sprint, and IDEO's Human-Centered Design—into a 4-phase development flow powered by 8 specialized AI agents:</p>

        <table class="doc-table">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Agents</th>
              <th>Key Activities</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Discovery</strong></td>
              <td><span class="agent-badge planning">Planning</span> <span class="agent-badge research">Research</span></td>
              <td>Problem extraction, PR/FAQ drafting, competitive analysis, success metrics</td>
            </tr>
            <tr>
              <td><strong>Shaping</strong></td>
              <td><span class="agent-badge planning">Planning</span> <span class="agent-badge ux">UX</span> <span class="agent-badge coding">Coding</span></td>
              <td>Scope definition, risk identification, technical spikes, interaction flows</td>
            </tr>
            <tr>
              <td><strong>Building</strong></td>
              <td><span class="agent-badge coding">Coding</span> <span class="agent-badge review">Review</span> <span class="agent-badge testing">Testing</span></td>
              <td>Vertical slice implementation, code review, automated testing</td>
            </tr>
            <tr>
              <td><strong>Delivery</strong></td>
              <td><span class="agent-badge devops">DevOps</span> <span class="agent-badge monitoring">Monitoring</span></td>
              <td>Staged rollout, metrics collection, feedback loops to next cycle</td>
            </tr>
          </tbody>
        </table>

        <h3>Key Differentiators</h3>
        <ul>
          <li><strong>Observable Process:</strong> Customers watch agents collaborate in a Slack-like interface. They see decisions being made, can answer questions, and understand exactly what's being built.</li>
          <li><strong>Real Code, Real Infrastructure:</strong> Unlike no-code tools, we generate actual code running on real infrastructure. No vendor lock-in, full ownership of codebase.</li>
          <li><strong>Iterative Feedback Loop:</strong> QA validates against requirements. Failed tests automatically trigger engineer fixes. Human checkpoints catch edge cases AI might miss.</li>
          <li><strong>Leverages Existing Building Blocks:</strong> The system builds on top of production-tested infrastructure (Contuit's multi-tenant platform), dramatically reducing time-to-market.</li>
        </ul>

        <h2>Technical Architecture</h2>
        <h3>Infrastructure Foundation: Contuit Platform</h3>
        <p>AgentForge leverages Contuit's existing multi-tenant SaaS platform as its foundation:</p>
        <ul>
          <li><strong>Multi-tenant data isolation</strong> — Already solved at the ORM level</li>
          <li><strong>Authentication & authorization</strong> — SSO, RBAC, API keys ready to use</li>
          <li><strong>Background job processing</strong> — Bull queues, scheduled tasks, webhooks</li>
          <li><strong>File storage & CDN</strong> — S3-compatible with signed URLs</li>
          <li><strong>Deployment pipeline</strong> — CI/CD, staging environments, rollbacks</li>
        </ul>
        <p>This represents 12+ months of engineering work that new entrants would need to build from scratch.</p>

        <h3>Agent Orchestration Layer</h3>
        <p>The orchestration system manages agent collaboration:</p>
        <ul>
          <li><strong>State Machine:</strong> Projects progress through 4 phases (Discovery → Shaping → Building → Delivery) with feedback loops</li>
          <li><strong>Message Bus:</strong> Agents communicate through structured events, enabling audit trails and debugging</li>
          <li><strong>Context Management:</strong> Each agent maintains focused context relevant to their role, preventing token bloat</li>
          <li><strong>Human Checkpoints:</strong> Configurable approval gates at phase boundaries (Problem, Pitch, Ship)</li>
        </ul>

        <h3>Artifact Generation</h3>
        <p>Engineers produce typed artifacts that the system understands:</p>
        <ul>
          <li><strong>API Endpoints:</strong> REST routes with validation, auth, database operations</li>
          <li><strong>Background Jobs:</strong> Scheduled tasks, event handlers, webhooks</li>
          <li><strong>UI Components:</strong> React components with Tailwind styling</li>
          <li><strong>Database Models:</strong> Schema definitions with migrations</li>
          <li><strong>Integrations:</strong> Third-party API connections (Stripe, Twilio, etc.)</li>
        </ul>

        <h2>Go-to-Market Strategy</h2>
        <h3>Phase 1: Human-Assisted MVP</h3>
        <p>Start with humans in the loop to validate the model and build trust:</p>
        <ul>
          <li><strong>Human sales conducts discovery calls</strong>, AI transcribes and extracts requirements</li>
          <li><strong>PM agent proposes task breakdown</strong>, human reviews and adjusts</li>
          <li><strong>Engineers build with human code review</strong> at key checkpoints</li>
          <li><strong>Human QA validates final delivery</strong> before customer handoff</li>
        </ul>
        <p>This approach generates revenue immediately while proving reliability.</p>

        <h3>Phase 2: Increasing Automation</h3>
        <p>As confidence grows, reduce human involvement:</p>
        <ul>
          <li>Automated customer intake via structured forms + AI follow-up</li>
          <li>PM handles full planning autonomously (human spot-checks)</li>
          <li>Engineers build without review for "solved" problem types</li>
          <li>Automated deployment for passing test suites</li>
        </ul>

        <h3>Target Customer Profile</h3>
        <ul>
          <li><strong>Company size:</strong> 10-500 employees</li>
          <li><strong>Technical capability:</strong> No in-house developers, or developers too busy for custom projects</li>
          <li><strong>Budget:</strong> $10K-75K per project</li>
          <li><strong>Timeline:</strong> Need solution in weeks, not months</li>
          <li><strong>Use cases:</strong> Internal tools, customer portals, process automation, data dashboards</li>
        </ul>

        <h3>Distribution Advantage</h3>
        <p>Ntiva's existing customer base provides immediate go-to-market:</p>
        <ul>
          <li>300+ existing MSP customers who trust Ntiva for technology decisions</li>
          <li>Regular touchpoints through account management and support</li>
          <li>Existing billing relationships and procurement processes</li>
          <li>Natural upsell from "we manage your IT" to "we build your software"</li>
        </ul>

        <h2>Business Model</h2>
        <h3>Pricing Structure</h3>
        <table class="doc-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Price Range</th>
              <th>Scope</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Starter</strong></td>
              <td>$5K-15K</td>
              <td>Single-purpose tool, 1-2 integrations</td>
              <td>1-2 weeks</td>
            </tr>
            <tr>
              <td><strong>Professional</strong></td>
              <td>$15K-40K</td>
              <td>Multi-feature app, complex workflows</td>
              <td>2-4 weeks</td>
            </tr>
            <tr>
              <td><strong>Enterprise</strong></td>
              <td>$40K-100K</td>
              <td>Full system, multiple user types, advanced integrations</td>
              <td>4-8 weeks</td>
            </tr>
          </tbody>
        </table>

        <h3>Unit Economics</h3>
        <ul>
          <li><strong>AI compute costs:</strong> $500-2,000 per project (Claude API)</li>
          <li><strong>Human review time (MVP):</strong> 10-20 hours per project at senior rate</li>
          <li><strong>Infrastructure:</strong> Marginal cost on existing Contuit platform</li>
          <li><strong>Target gross margin:</strong> 60-70% at scale</li>
        </ul>

        <h3>Revenue Projections</h3>
        <table class="doc-table">
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Projects</th>
              <th>Avg Price</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Q1 2026</td>
              <td>3</td>
              <td>$15K</td>
              <td>$45K</td>
            </tr>
            <tr>
              <td>Q2 2026</td>
              <td>6</td>
              <td>$20K</td>
              <td>$120K</td>
            </tr>
            <tr>
              <td>Q3 2026</td>
              <td>10</td>
              <td>$25K</td>
              <td>$250K</td>
            </tr>
            <tr>
              <td>Q4 2026</td>
              <td>15</td>
              <td>$30K</td>
              <td>$450K</td>
            </tr>
          </tbody>
        </table>
        <p><strong>Year 1 Total: ~$865K</strong></p>

        <h2>Risks & Mitigations</h2>
        <table class="doc-table">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Mitigation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>AI quality inconsistency</strong></td>
              <td>Human checkpoints in MVP; extensive test coverage; iterative improvement based on failure patterns</td>
            </tr>
            <tr>
              <td><strong>Scope creep from customers</strong></td>
              <td>Clear scoping in PM phase; change order process; tiered pricing by complexity</td>
            </tr>
            <tr>
              <td><strong>Competition from AI coding tools</strong></td>
              <td>Focus on non-technical customers; full-service delivery vs. developer tools</td>
            </tr>
            <tr>
              <td><strong>API cost increases</strong></td>
              <td>Multi-model support; caching and context optimization; negotiate volume pricing</td>
            </tr>
            <tr>
              <td><strong>Customer trust in AI-built software</strong></td>
              <td>Observable process; human QA; warranty/support guarantees; case studies</td>
            </tr>
          </tbody>
        </table>

        <h2>Investment Ask</h2>
        <h3>Compensation Structure</h3>
        <table class="doc-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Revenue Share</strong></td>
              <td>15-25% of AgentForge revenue (new product line, separate from existing division profit share)</td>
            </tr>
            <tr>
              <td><strong>Strategic Title</strong></td>
              <td>VP Product Development or equivalent, reflecting strategic responsibility for new business line</td>
            </tr>
            <tr>
              <td><strong>Base Salary</strong></td>
              <td>Adjustment reflecting increased strategic scope</td>
            </tr>
            <tr>
              <td><strong>Team Building</strong></td>
              <td>Authority and budget to build team as product scales</td>
            </tr>
          </tbody>
        </table>

        <div class="doc-callout">
          <p><strong>Framing:</strong> This is an opportunity to participate in the upside of a new business I am creating, not taking from existing business. I could build this independently or pursue acquisition elsewhere—choosing to build with Ntiva should warrant significant upside participation.</p>
        </div>

        <h3>Why Now</h3>
        <ul>
          <li><strong>AI capability inflection:</strong> Claude Code and multi-agent patterns have reached production readiness</li>
          <li><strong>Proven infrastructure:</strong> Contuit building blocks provide 12+ months head start</li>
          <li><strong>Distribution advantage:</strong> 300+ existing MSP customers provide immediate go-to-market</li>
          <li><strong>First-mover window:</strong> Market is nascent—establishing leadership position now is critical</li>
          <li><strong>Low risk start:</strong> Human-assisted model generates revenue from day one</li>
        </ul>

        <p style="text-align: center; color: var(--text-muted); margin-top: 4rem; font-style: italic;">— End of Document —</p>
      </div>
    </div>
  </div>

  <!-- ==================== PROJECTIONS PAGE ==================== -->
  <div id="projections-page" class="page">
    <div id="projections-root"></div>
  </div>
`

// Router configuration
const routes: Record<string, string> = {
  '/': 'demo',
  '/docs': 'docs',
  '/projections': 'projections'
}

// Get page from path
function getPageFromPath(path: string): string {
  return routes[path] || 'demo'
}

// Page navigation with routing
function navigateTo(path: string, pushState = true) {
  const page = getPageFromPath(path)

  // Update URL if needed
  if (pushState && window.location.pathname !== path) {
    history.pushState({ page }, '', path)
  }

  // Update active page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.getElementById(page + '-page')?.classList.add('active')
  window.scrollTo(0, 0)

  // Update nav active state
  document.querySelectorAll('.nav-step').forEach(btn => {
    btn.classList.remove('active')
    if (btn.id === `nav-${page}`) {
      btn.classList.add('active')
    }
  })

  // Re-trigger animations for demo page
  if (page === 'demo') {
    document.querySelectorAll('.step-info, .demo-panel').forEach(el => {
      el.classList.remove('visible')
    })
    setTimeout(() => {
      observerCallback()
    }, 100)
  }
}

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const path = window.location.pathname
  navigateTo(path, false)
})

// Initialize router on page load
const initialPath = window.location.pathname
navigateTo(initialPath, false)

// Set up click handlers with routing
document.getElementById('logo-demo')?.addEventListener('click', () => navigateTo('/'))
document.getElementById('nav-demo')?.addEventListener('click', () => navigateTo('/'))
document.getElementById('nav-docs')?.addEventListener('click', () => navigateTo('/docs'))
document.getElementById('nav-projections')?.addEventListener('click', () => navigateTo('/projections'))
document.getElementById('hero-docs-btn')?.addEventListener('click', () => navigateTo('/docs'))
document.getElementById('footer-docs-btn')?.addEventListener('click', () => navigateTo('/docs'))

// Intersection observer for animations
const observerOptions = { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }

function observerCallback() {
  document.querySelectorAll('.step-info, .demo-panel').forEach(el => {
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.8) {
      el.classList.add('visible')
    }
  })
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
    } else {
      entry.target.classList.remove('visible')
    }
  })
}, observerOptions)

document.querySelectorAll('.step-info, .demo-panel').forEach(el => observer.observe(el))

// Active section highlighting
const sections = document.querySelectorAll<HTMLElement>('section[id]')
const navLinks = document.querySelectorAll('.nav-step')

window.addEventListener('scroll', () => {
  let current = ''
  sections.forEach(section => {
    const sectionTop = section.offsetTop
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute('id') || ''
    }
  })
  navLinks.forEach(link => {
    link.classList.remove('active')
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active')
    }
  })
})

// Components dropdown toggle
const componentsBtn = document.getElementById('nav-components')
const componentsMenu = document.getElementById('components-menu')

componentsBtn?.addEventListener('click', (e) => {
  e.stopPropagation()
  componentsMenu?.classList.toggle('open')
})

document.addEventListener('click', () => {
  componentsMenu?.classList.remove('open')
})

// Mount React TaskBoard demo component
let taskBoardMounted = false
const taskBoardRoot = document.getElementById('task-board-demo-root')

if (taskBoardRoot) {
  const taskBoardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !taskBoardMounted) {
        taskBoardMounted = true
        const root = createRoot(taskBoardRoot)
        root.render(createElement(TaskBoardDemo, { autoPlay: true, loop: true, loopDelay: 3000, minHeight: 340 }))
      }
    })
  }, { threshold: 0.3 })

  taskBoardObserver.observe(taskBoardRoot)
}

// Mount React Projections page component
let projectionsMounted = false
const projectionsRoot = document.getElementById('projections-root')

if (projectionsRoot) {
  // Mount when navigating to projections page
  const mountProjections = () => {
    if (!projectionsMounted && document.getElementById('projections-page')?.classList.contains('active')) {
      projectionsMounted = true
      const root = createRoot(projectionsRoot)
      root.render(createElement(ProjectionsPage))
    }
  }

  // Check on page load and navigation
  mountProjections()

  // Re-check when navigating (use MutationObserver to detect class changes)
  const projectionsPage = document.getElementById('projections-page')
  if (projectionsPage) {
    const projectionsMutationObserver = new MutationObserver(() => {
      mountProjections()
    })
    projectionsMutationObserver.observe(projectionsPage, { attributes: true, attributeFilter: ['class'] })
  }
}
