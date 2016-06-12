declare module 'washington' {
   declare var exports: (
     name: string,
     example?: (done: (result: any) => void) => void
   ) => void
   declare function go(): void
}
