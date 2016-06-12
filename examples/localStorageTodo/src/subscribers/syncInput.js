/* global localStorage */
import { connect } from 'redux-haiku'

const syncItems = ({ input }) => {
  localStorage.setItem('localStorageTodo.input', input)
}

const mapStateToProps = (state, prevState) => {
  return state.input !== prevState.input && {
    input: state.input
  }
}

export default connect(mapStateToProps)(syncItems)
