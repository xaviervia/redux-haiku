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

    if (selectedState) {
      const boundActionCreators = mapDispatchToProps
        ? mapDispatchToProps(store.dispatch)
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
