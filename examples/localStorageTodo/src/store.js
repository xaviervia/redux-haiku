import { createStore } from 'redux'
import syncItems from './subscribers/syncItems'
import syncInput from './subscribers/syncInput'
import reducer from './reducer'

export default () => {
  const store = createStore(
    reducer,
    { tasks: [] },
    window.devToolsExtension
      ? window.devToolsExtension()
      : (f) => f
  )

  syncItems(store)
  syncInput(store)

  return store
}
