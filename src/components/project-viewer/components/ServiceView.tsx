import { useMemo } from 'react'
import { BoxIcon, CodeIcon, DatabaseIcon, LayersIcon } from '../../shared/icons'
import type { ServiceMetadata } from '../types'
import { markdownToHtml } from './utils'
import styles from '../ProjectViewer.module.css'

interface ServiceViewProps {
  metadata: ServiceMetadata
  readme?: string
  onFileClick?: (path: string) => void
  servicePath: string
}

const SERVICE_TYPE_ICONS: Record<ServiceMetadata['type'], typeof BoxIcon> = {
  dataobject: DatabaseIcon,
  api: CodeIcon,
  worker: LayersIcon,
  ui: BoxIcon,
}

const SERVICE_TYPE_LABELS: Record<ServiceMetadata['type'], string> = {
  dataobject: 'Data Object',
  api: 'API Service',
  worker: 'Background Worker',
  ui: 'UI Component',
}

export function ServiceView({ metadata, readme, onFileClick, servicePath }: ServiceViewProps) {
  const TypeIcon = SERVICE_TYPE_ICONS[metadata.type] || BoxIcon
  const typeLabel = SERVICE_TYPE_LABELS[metadata.type] || metadata.type

  const readmeHtml = useMemo(() => {
    if (!readme) return null
    return markdownToHtml(readme)
  }, [readme])

  return (
    <div className={styles.serviceView}>
      <div className={styles.serviceHeader}>
        <div className={styles.serviceIcon}>
          <TypeIcon />
        </div>
        <div className={styles.serviceHeaderInfo}>
          <h1 className={styles.serviceName}>{metadata.name}</h1>
          <div className={styles.serviceTypeBadge}>{typeLabel}</div>
          <span className={styles.serviceVersion}>v{metadata.version}</span>
        </div>
      </div>

      <p className={styles.serviceDescription}>{metadata.description}</p>

      {metadata.tags && metadata.tags.length > 0 && (
        <div className={styles.serviceTags}>
          {metadata.tags.map(tag => (
            <span key={tag} className={styles.serviceTag}>{tag}</span>
          ))}
        </div>
      )}

      {metadata.schema && metadata.schema.fields.length > 0 && (
        <section className={styles.serviceSection}>
          <h2 className={styles.serviceSectionTitle}>Schema</h2>
          <table className={styles.serviceSchemaTable}>
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Constraints</th>
              </tr>
            </thead>
            <tbody>
              {metadata.schema.fields.map(field => (
                <tr key={field.name}>
                  <td className={styles.schemaFieldName}>{field.name}</td>
                  <td className={styles.schemaFieldType}>{field.type}</td>
                  <td className={styles.schemaFieldConstraints}>
                    {field.required && <span className={styles.constraint}>required</span>}
                    {field.unique && <span className={styles.constraint}>unique</span>}
                    {field.auto && <span className={styles.constraintAuto}>auto</span>}
                    {field.min !== undefined && <span className={styles.constraintRange}>min: {field.min}</span>}
                    {field.max !== undefined && <span className={styles.constraintRange}>max: {field.max}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {metadata.endpoints && metadata.endpoints.length > 0 && (
        <section className={styles.serviceSection}>
          <h2 className={styles.serviceSectionTitle}>Endpoints</h2>
          <div className={styles.serviceEndpoints}>
            {metadata.endpoints.map((endpoint, i) => (
              <div key={i} className={styles.serviceEndpoint}>
                <span className={`${styles.endpointMethod} ${styles[`method${endpoint.method}`]}`}>
                  {endpoint.method}
                </span>
                <code className={styles.endpointPath}>{endpoint.path}</code>
                <span className={styles.endpointDescription}>{endpoint.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {metadata.dependencies && metadata.dependencies.length > 0 && (
        <section className={styles.serviceSection}>
          <h2 className={styles.serviceSectionTitle}>Dependencies</h2>
          <ul className={styles.serviceDependencies}>
            {metadata.dependencies.map(dep => (
              <li key={dep}>{dep}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.serviceSection}>
        <h2 className={styles.serviceSectionTitle}>Files</h2>
        <div className={styles.serviceFiles}>
          <button
            className={styles.serviceFileLink}
            onClick={() => onFileClick?.(`${servicePath}/${metadata.entry}`)}
          >
            <CodeIcon className={styles.serviceFileIcon} />
            {metadata.entry}
          </button>
          <button
            className={styles.serviceFileLink}
            onClick={() => onFileClick?.(`${servicePath}/service.json`)}
          >
            <CodeIcon className={styles.serviceFileIcon} />
            service.json
          </button>
          <button
            className={styles.serviceFileLink}
            onClick={() => onFileClick?.(`${servicePath}/README.md`)}
          >
            <CodeIcon className={styles.serviceFileIcon} />
            README.md
          </button>
        </div>
      </section>

      {readmeHtml && (
        <section className={styles.serviceSection}>
          <h2 className={styles.serviceSectionTitle}>Documentation</h2>
          <div
            className={styles.serviceReadme}
            dangerouslySetInnerHTML={{ __html: readmeHtml }}
          />
        </section>
      )}
    </div>
  )
}
