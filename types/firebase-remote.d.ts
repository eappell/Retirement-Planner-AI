// Minimal stubs for Firebase CDN modules used in imports.
// These keep local `npx tsc` runs from failing due to remote module imports.
declare module 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js' {
  export const initializeApp: any;
  const _default: any;
  export default _default;
}

declare module 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js' {
  export const getAuth: any;
  export const onAuthStateChanged: any;
  export const signInWithPopup: any;
  export const createUserWithEmailAndPassword: any;
  export const signInWithEmailAndPassword: any;
  export const GoogleAuthProvider: any;
  const _default: any;
  export default _default;
}

declare module 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js' {
  export const getFirestore: any;
  export const doc: any;
  export const getDoc: any;
  export const setDoc: any;
  export const serverTimestamp: any;
  export const collection: any;
  const _default: any;
  export default _default;
}

// Catch-all for other CDN imports
declare module 'https://www.gstatic.com/firebasejs/*' {
  const whatever: any;
  export = whatever;
}
