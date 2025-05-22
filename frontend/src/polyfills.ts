// frontend/src/polyfills.ts

/**
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js'; // Included automatically by Angular CLI.

/**
 * Web Animations `@angular/platform-browser/animations`
 * Only required if you need animations triggered by the Animations module.
 * Requires `npm install --save web-animations-js`.
 * Uncomment below if needed.
 */
// import 'web-animations-js';  // Run `npm install --save web-animations-js`.

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/** IE11 requires the following for NgClass support on SVG elements */
// import 'classlist.js';  // Run `npm install --save classlist.js`.

/** IE10 and IE11 requires the following for the Reflect API. */
// import 'core-js/es/reflect'; // `core-js` was removed from Angular 16 default polyfills

/** Evergreen browsers require these. **/
// Used for reflect-metadata in JIT. If you use AOT (and only AOT) you can remove).
// import 'core-js/es/reflect'; // `core-js` was removed from Angular 16 default polyfills


/**
 * Required to support Web Animations `@angular/platform-browser/animations` even on browsers
 * that have native support such as Chrome, Firefox, Edge.
 */
// import 'web-animations-js'; // Run `npm install --save web-animations-js`.


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

/**
 * SockJS/WebSocket Environment Polyfills for Browser/SSR Compatibility
 *
 * Libraries like SockJS might expect Node.js-like globals.
 * These provide basic shims to prevent errors in browser environments.
 */
if (typeof (window as any).global === 'undefined') {
  console.log('[Polyfills] Defining window.global');
  (window as any).global = window;
}

if (typeof (window as any).Buffer === 'undefined') {
  console.log('[Polyfills] Defining window.Buffer stub');
  (window as any).Buffer = {
    isBuffer: () => false,
    // Add other Buffer methods here ONLY if needed by a specific dependency.
  };
}

if (typeof (window as any).process === 'undefined') {
  console.log('[Polyfills] Defining window.process stub');
  (window as any).process = {
    env: { DEBUG: undefined }, // Basic environment stub
    nextTick: (callback: (...args: any[]) => void, ...args: any[]) => setTimeout(() => callback(...args), 0), // Basic nextTick polyfill using setTimeout
    // Add other process properties here ONLY if needed by a specific dependency.
  };
}

// Export empty to ensure file is recognized as a module by TypeScript
export {};
