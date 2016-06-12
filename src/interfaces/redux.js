declare module 'redux' {
   declare function createStore(reducer:(state: any, action: any) => any): any
   declare function combineReducers(...reducer:any): any
   declare function compose(...f:any): any
}
