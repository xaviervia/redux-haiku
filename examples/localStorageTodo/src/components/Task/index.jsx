import React from 'react'
import styles from './styles.css'

export default function Task ({ description, done, onDone, onRemove }) {
  const className = done
    ? styles.task + ' ' + styles.isDone
    : styles.task

  return (
    <li className={className}>
      {description}

      <button className={styles.remove} onClick={onRemove}>
        Remove
      </button>

      {!done && <button className={styles.done} onClick={onDone}>
        Mark as Done
      </button>}
    </li>
  )
}
