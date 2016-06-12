import {
  ADD_TASK,
  LOAD_TASKS,
  REMOVE_TASK,
  SET_AS_DONE,
  USER_INPUT
} from './actionTypes'
import uuid from 'uuid'

export const addTask = (description) => ({
  type: ADD_TASK,
  payload: {
    key: uuid.v4()
  }
})

export const loadTasks = (tasks) => ({
  type: LOAD_TASKS,
  payload: tasks
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

export const userInput = (text) => ({
  type: USER_INPUT,
  payload: text
})
