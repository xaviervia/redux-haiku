import example from 'washington'
import { deepEqual } from 'assert'
import { connect, getDiff } from './src/index'
import { createStore, compose } from 'redux'
import { execSync } from 'child_process'

type Action = {
  type: string,
  payload: any
}

type Item = {
  key: string,
  saved: boolean
}

type State = {
  items: Array<Item>
}

example(`save an item removed after it's is added`, (done) => {
  /* ACTIONS */
  const addItemActionCreator = (text): Action => ({
    type: 'ADD_ITEM',
    payload: {
      key: text,
      saved: false
    }
  })

  const itemSavedActionCreator = (key): Action => ({
    type: 'ITEM_SAVED',
    payload: key
  })

  /* EXTERNAL LIBRARY FOR A SIDE EFFECT */
  const asyncSaveFunction = (item, onSaved) => {
    // We fake the asynchronous save request, which could for example
    // be calling a REST endpoint
    setTimeout(() => {
      console.log(`item('${item.key}') is saved now`)
      onSaved(item)
    }, 20)
  }

  /* REDUCER */
  const initialState: State = { items: [] }

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'ADD_ITEM':
        return {
          items: [ ...state.items, action.payload ]
        }

      case 'ITEM_SAVED':
        return {
          items: [
            ...state.items.map((item) =>
              item.key === action.payload
                ? { ...item, saved: true }
                : item
            )
          ]
        }

      default:
        return state
    }
  }

  /* SELECTORS */
  const getItemKeysSelector = (state) =>
    state &&
    state.items.map(({ key }) => ({ key }))

  /* SUBSCRIBER *new shiny thing*
   * you can think about this as something like a react-redux container
   * for arbitrary asynchronous side effects
   */
  const subscriber = ({ items, onSaved }) =>
    items.map((item) => asyncSaveFunction(item, onSaved))

  const mapStateToProps = (state, prevState) => {
    const newItemKeys = getDiff(getItemKeysSelector)(prevState, state).after

    return newItemKeys && {
      items: newItemKeys.map(({ key }) =>
        state.items.find((item) => item.key === key)
      )
    }
  }

  const mapDispatchToProps = (dispatch, getState) => ({
    onSaved: (item) =>
      compose(dispatch, itemSavedActionCreator)(item.key)
  })

  const connectedSubscriber = connect(
    mapStateToProps,
    mapDispatchToProps
  )(subscriber)

  /* STORE */
  const store = createStore(reducer, initialState)

  // Connect the subscriber
  connectedSubscriber(store)

  // Start the thing by creating two items
  store.dispatch(addItemActionCreator('hello world of subscribers'))
  store.dispatch(addItemActionCreator('hola mundo de los subscribers'))

  /* ASSERTION */
  // Let's wait a couple of milliseconds for the asynchronous operations to
  // complete
  setTimeout(() => {
    deepEqual(
      store.getState().items,
      [
        {
          key: 'hello world of subscribers',
          saved: true
        },

        {
          key: 'hola mundo de los subscribers',
          saved: true
        }
      ]
    )

    done()
  }, 30)
})

example(`it will show an error if you try to dispatch synchronously`, (done) => {
  const addItem = (key) => ({
    type: 'ADD_ITEM',
    payload: { key }
  })

  const compactItems = () => ({
    type: 'COMPACT_ITEMS'
  })

  const initialState = { items: [], compacted: false }

  const reducer = (state, action) => {
    switch (action.type) {
      case 'ADD_ITEM':
        return { ...state, items: [ ...state.items, action.payload ] }

      case 'COMPACT_ITEMS':
        return { ...state, compected: true }

      default:
        return state
    }
  }

  const store = createStore(reducer, initialState)

  const faultySubscriber = ({ items, onThirdItem }) => {
    if (items.length > 2) {
      onThirdItem()
    }
  }
  const mapStateToProps = (state) => state
  const mapDispatchToProps = (dispatch) => ({
    onThirdItem: compose(dispatch, compactItems)
  })

  const connectedFaultySubscriber = connect(mapStateToProps, mapDispatchToProps)(faultySubscriber)

  connectedFaultySubscriber(store)

  store.dispatch(addItem('first'))
  store.dispatch(addItem('second'))

  try {
    store.dispatch(addItem('third'))
  } catch (e) {
    done(e.message, `Dispatching synchronously in a Subscriber is forbidden. Callbacks provided to Subscribers are meant to be used by asynchronous side effects as a way to trigger actions back into the store. Operations on the store to be done as a consequence of a particular state change should be done in reducers or selectors instead.`)
  }
})

example.go()
