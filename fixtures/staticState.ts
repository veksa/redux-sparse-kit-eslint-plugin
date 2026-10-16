/**
 * Test fixture: an application's static state, registered with
 * redux-sparse-kit the way its README describes.
 */
declare module 'redux-sparse-kit' {
  interface StaticState {
    router: { path: string };
    session: { user: string };
  }
}

export {};
