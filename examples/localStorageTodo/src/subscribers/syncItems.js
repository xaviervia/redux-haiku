/* global localStorage */
import { connect } from 'redux-haiku'

const syncItems = ({ tasks }) => {
  localStorage.setItem('localStorageTodo.tasks', JSON.stringify(tasks))
}

const mapStateToProps = (state, prevState) => {
  return state.tasks !== prevState.tasks && {
    tasks: state.tasks
  }
}

export default connect(mapStateToProps)(syncItems)
