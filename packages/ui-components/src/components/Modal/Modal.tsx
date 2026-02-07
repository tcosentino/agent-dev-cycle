import { type ReactNode } from 'react'
import { XIcon } from '../../icons/icons'
import styles from './Modal.module.css'

export interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <XIcon width={20} height={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Re-export styles for use in modal content
export { styles as modalStyles }
