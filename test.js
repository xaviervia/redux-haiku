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
        return initialState
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
  const store = createStore(reducer)

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

example(`it will show an error if you try to dispatch synchronously`)

example.go()
