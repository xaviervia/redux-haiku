import { ADD_TASK, REMOVE_TASK, SET_AS_DONE } from './actionTypes'
import uuid from 'uuid'

export const addTask = (description) => ({
  type: ADD_TASK,
  payload: {
    key: uuid.v4(),
    description
  }
})

export const removeTask = (key) => ({
  type: REMOVE_TASK,
  payload: {
    key
  }
})

export const setAsDone = (key) => ({
  type: SET_AS_DONE,
  payload: {
    key
  }
})
