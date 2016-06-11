type Action = {
  type: string,
  payload: any,
  meta: ?any
}

type Selector = (state: any, prevState: any) => any

export const connect = (
  mapStateToProps: Selector,
  mapDispatchToProps: (dispatch: (action: Action) => void) => any
) => (
  subscriber: (args: any) => void
) => (store: any) => {

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
  return {
    before: undefined,
    after: undefined
  }
}
