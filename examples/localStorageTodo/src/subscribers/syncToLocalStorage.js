/* global localStorage */
import { connect } from 'redux-haiku'

const syncToLocalStorage = ({ tasks }) => {
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

const mapStateToProps = (state, prevState) => {
  return state.tasks !== prevState.tasks && {
    tasks: state.tasks
  }
}

export default connect(mapStateToProps)(syncToLocalStorage)
