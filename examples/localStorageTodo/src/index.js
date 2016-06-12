/* global localStorage */
import React from 'react'
import configureStore from './store'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import App from './containers/App'
import { loadTasks, userInput } from './actions'
import uuid from 'uuid'

const store = configureStore()

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('localStorageTodo')
)

if (localStorage.getItem('localStorageTodo.tasks')) {
  store.dispatch(
    loadTasks(
      JSON.parse(localStorage.getItem('localStorageTodo.tasks'))
    )
  )
} else {
  store.dispatch(
    loadTasks([
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
    ])
  )
}

if (localStorage.getItem('localStorageTodo.input')) {
  store.dispatch(
    userInput(
      localStorage.getItem('localStorageTodo.input')
    )
  )
}
