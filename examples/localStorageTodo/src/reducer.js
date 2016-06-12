import {
  ADD_TASK,
  LOAD_TASKS,
  REMOVE_TASK,
  SET_AS_DONE,
  USER_INPUT
} from './actionTypes'

const initialState = {
  tasks: [],
  input: ''
}

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case ADD_TASK:
      if (state.input.trim() !== '') {
        return {
          ...state,
          tasks: [
            ...state.tasks,
            { ...payload, description: state.input }
          ],
          input: ''
        }
      } else {
        return state
      }

    case LOAD_TASKS:
      return {
        ...state,
        tasks: payload
      }

    case REMOVE_TASK:
      return {
        ...state,
        tasks: [
          ...state.tasks.filter((task) => task.key !== payload.key)
        ]
      }

    case SET_AS_DONE:
      return {
        ...state,
        tasks: [
          ...state.tasks.map(
            (task) => task.key === payload.key
              ? { ...task, done: true }
              : task
          )
        ]
      }

    case USER_INPUT:
      return {
        ...state,
        input: payload
      }

    default:
      return state
  }
}
