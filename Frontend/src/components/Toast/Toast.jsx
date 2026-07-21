import styles from './Toast.module.scss'

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚡',
}

export const ToastContainer = ({ toasts, onRemove }) => (
  <div className={styles.container} role="region" aria-label="Notifications">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`${styles.toast} ${styles[t.type]}`}
        role="alert"
      >
        <span className={styles.icon}>{ICONS[t.type]}</span>
        <span className={styles.message}>{t.message}</span>
        <button
          className={styles.close}
          onClick={() => onRemove(t.id)}
          aria-label="Dismiss notification"
        >✕</button>
      </div>
    ))}
  </div>
)
