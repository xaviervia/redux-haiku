import React from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import * as actions from '../actions'
import styles from './styles.css'
import Task from '../components/Task'

function App ({ input, tasks, onAdd, onDone, onInput, onRemove }) {
  return (
    <div>
      <form onSubmit={handleSubmit(onAdd)}>
        <input
          autoFocus
          className={styles.input}
          type='text'
          placeholder='What would you like to do next?'
          value={input}
          onChange={(e) => onInput(e.target.value)}
        />

        <button
          className={styles.button}
          type='submit'>
          Add Task
        </button>
      </form>

      <ul className={styles.list}>
        {tasks.map(({ key, ...props }) => (
          <Task
            key={key}
            onRemove={() => onRemove(key)}
            onDone={() => onDone(key)}
            {...props}
          />
        ))}
      </ul>
    </div>
  )
}

const handleSubmit = (onAdd) => (e) => {
  e.preventDefault()

  onAdd()
}

const mapStateToProps = (state) => state
const mapDispatchToProps = (dispatch) => ({
  onAdd: compose(dispatch, actions.addTask),
  onInput: compose(dispatch, actions.userInput),
  onRemove: compose(dispatch, actions.removeTask),
  onDone: compose(dispatch, actions.setAsDone)
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
