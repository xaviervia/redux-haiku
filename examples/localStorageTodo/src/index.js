import React from 'react'
import { createStore } from 'redux'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import syncToLocalStorage from './subscribers/syncToLocalStorage'
import App from './containers/App'

const store = createStore()
syncToLocalStorage(store)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('localStorageTodo')
)
