import { Icon } from './icon'
import styles from './public-action.module.css'

// Presentation only. Real navigation, submit locks, analytics, accessibility
// names and booking eligibility stay with the existing caller.
export function PublicActionContent({ children, variant = 'primary', iconOnly = false }) {
  const secondary = variant === 'secondary'
  return <span className={`${styles.content} ${secondary ? styles.secondaryContent : styles.primaryContent}${iconOnly ? ` ${styles.iconOnlyContent}` : ''}`}>
    {secondary && <span className={styles.chip} aria-hidden="true"><Icon name="outlineMap"/></span>}
    <span className={styles.label}>{children}</span>
    {!secondary && <span className={styles.chip} aria-hidden="true"><Icon name="arrowUpRight"/></span>}
  </span>
}

export function PublicAction({ as: Element = 'button', variant = 'primary', children, className = '', iconOnly = false, ...props }) {
  const secondary = variant === 'secondary'
  return <Element {...props} {...(Element === 'button' && !props.type ? { type: 'button' } : {})}
    className={`${styles.action} ${secondary ? styles.secondary : styles.primary}${iconOnly ? ` ${styles.iconOnly}` : ''}${className ? ` ${className}` : ''}`}
    data-public-action={secondary ? 'secondary' : 'primary'}>
    <PublicActionContent variant={variant} iconOnly={iconOnly}>{children}</PublicActionContent>
  </Element>
}

export function PublicActionPair({ children, className = '', ...props }) {
  return <div {...props} className={`${styles.pair}${className ? ` ${className}` : ''}`} data-public-action-pair>{children}</div>
}
