import objectDifference from 'object-difference'

type Action = {
  type: string,
  payload: any,
  meta: ?any
}

type Selector = (state: any, prevState: any) => any

export const connect = (
  mapStateToProps: Selector,
  mapDispatchToProps: ?(dispatch: (action: Action) => void) => any
) => (
  subscriber: (args: any) => void
) => (store: any) => {
  let prevState = store.getState()

  store.subscribe(() => {
    const nextState = store.getState()
    const selectedState = mapStateToProps(nextState, prevState)
    let dispatchAllowed = false
    const wrappedDispatch = (x) => {
      if (dispatchAllowed) {
        store.dispatch(x)
      } else {
        throw new Error('Dispatching synchronously in a Subscriber is forbidden. Callbacks provided to Subscribers are meant to be used by asynchronous side effects as a way to trigger actions back into the store. Operations on the store to be done as a consequence of a particular state change should be done in reducers or selectors instead.')
      }
    }
    setTimeout(() => dispatchAllowed = true)

    if (selectedState) {
      const boundActionCreators = mapDispatchToProps
        ? mapDispatchToProps(wrappedDispatch)
        : {}

      subscriber({
        ...selectedState,
        ...boundActionCreators
      })
    }

    prevState = store.getState()
  })
}

type DiffResult = {
  before: any,
  after: any
}

export const getDiff = (
  selector: Selector
) => (
  prev: any,
  next: any
): DiffResult => {
  const diff = objectDifference(selector(prev), selector(next)) || []

  return {
    before: diff[0],
    after: diff[1]
  }
}
