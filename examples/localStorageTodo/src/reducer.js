import { ADD_TASK, REMOVE_TASK, SET_AS_DONE } from './actionTypes'
import uuid from 'uuid'

const initialState = {
  tasks: [
    {
      key: uuid.v4(),
      description: 'React to the news'
    },
    {
      key: uuid.v4(),
      description: 'Reduce the overhead'
    },
    {
      key: uuid.v4(),
      description: 'Graph the fastest path',
      done: true
    }
  ]
}

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case ADD_TASK:
      return {
        ...state,
        tasks: [ ...state.tasks, payload ]
      }

    case REMOVE_TASK:
      return {
        ...state,
        tasks: [
          ...state.tasks.filter(task => task.key !== payload.key)
        ]
      }

    case SET_AS_DONE:
      return {
        ...state,
        tasks: [
          ...state.tasks.map(
            task => task.key === payload.key
              ? { ...task, done: true }
              : task
          )
        ]
      }

    default:
      return state
  }
}
