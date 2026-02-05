import styles from './ActionBadgeExplorer.module.css'

export function ActionBadgeExplorer() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Action Badge Variations</h1>

      {/* Option 1: Pill with icon prefix */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Option 1: Pill with arrow icon</h2>
        <p className={styles.description}>Clean pill shape with subtle arrow indicating action</p>
        <div className={styles.examples}>
          <div className={styles.option1}>
            <span className={styles.option1Icon}>-&gt;</span>
            <span className={styles.option1Label}>Created</span>
            <span className={styles.option1Task}>BAAP-1</span>
          </div>
          <div className={styles.option1}>
            <span className={styles.option1Icon}>-&gt;</span>
            <span className={styles.option1Label}>Analyzed requirements</span>
          </div>
        </div>
      </section>

      {/* Option 2: Terminal style */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Option 2: Terminal/CLI style</h2>
        <p className={styles.description}>Monospace, code-like appearance</p>
        <div className={styles.examples}>
          <div className={styles.option2}>
            <span className={styles.option2Prefix}>$</span>
            <span className={styles.option2Label}>created</span>
            <a href="#" className={styles.option2Task}>BAAP-1</a>
          </div>
          <div className={styles.option2}>
            <span className={styles.option2Prefix}>$</span>
            <span className={styles.option2Label}>analyzed_requirements</span>
          </div>
        </div>
      </section>

      {/* Option 3: Slack-style reaction */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Option 3: Compact inline tag</h2>
        <p className={styles.description}>Minimal, like a Slack reaction or GitHub label</p>
        <div className={styles.examples}>
          <div className={styles.option3}>
            <span className={styles.option3Label}>Created</span>
            <a href="#" className={styles.option3Task}>BAAP-1</a>
          </div>
          <div className={styles.option3Status}>
            Analyzed requirements
          </div>
        </div>
      </section>

      {/* Option 4: Two-tone card */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Option 4: Two-tone card</h2>
        <p className={styles.description}>Action label and task as visually distinct sections</p>
        <div className={styles.examples}>
          <div className={styles.option4}>
            <span className={styles.option4Label}>Created</span>
            <a href="#" className={styles.option4Task}>BAAP-1</a>
          </div>
          <div className={styles.option4Solo}>
            <span className={styles.option4Label}>Analyzed requirements</span>
          </div>
        </div>
      </section>

      {/* Option 5: Notion-style */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Option 5: Notion/Linear style</h2>
        <p className={styles.description}>Clean with colored task reference</p>
        <div className={styles.examples}>
          <div className={styles.option5}>
            <span className={styles.option5Check}>&#10003;</span>
            <span className={styles.option5Label}>Created</span>
            <a href="#" className={styles.option5Task}>BAAP-1</a>
          </div>
          <div className={styles.option5}>
            <span className={styles.option5Check}>&#10003;</span>
            <span className={styles.option5Label}>Analyzed requirements</span>
          </div>
        </div>
      </section>

      {/* Option 6: Gradient border */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Option 6: Accent left border</h2>
        <p className={styles.description}>Subtle card with colored left accent</p>
        <div className={styles.examples}>
          <div className={styles.option6}>
            <span className={styles.option6Label}>Created</span>
            <a href="#" className={styles.option6Task}>BAAP-1</a>
          </div>
          <div className={styles.option6}>
            <span className={styles.option6Label}>Analyzed requirements</span>
          </div>
        </div>
      </section>

      {/* Option 7: Floating tag */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Option 7: Floating badges</h2>
        <p className={styles.description}>Separate floating elements with shadow</p>
        <div className={styles.examples}>
          <div className={styles.option7Wrapper}>
            <span className={styles.option7Label}>Created</span>
            <a href="#" className={styles.option7Task}>BAAP-1</a>
          </div>
          <div className={styles.option7Wrapper}>
            <span className={styles.option7Status}>Analyzed requirements</span>
          </div>
        </div>
      </section>
    </div>
  )
}
