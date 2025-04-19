# Plan to Fix Frontend NPM Build Errors

## Analysis of Build Errors

The `npm run build` command revealed several categories of errors:

1.  **Module/Export Issues:**
    *   `import-is-undefined` &amp; `File ... is not a module`: `frontend/src/app/app.config.server.ts` is missing an export statement.
    *   `Cannot redeclare exported variable` &amp; `Export declaration conflicts`: Duplicate export statements in `auth.guard.ts`, `auth.routes.ts`, `chat.routes.ts`, `matching.routes.ts`, `profile.routes.ts`.
    *   `Cannot find module`: Components cannot find corresponding service/model files (potential path or side-effect issue).

2.  **TypeScript Type Errors:**
    *   `Object literal may only specify known properties`: `register.component.ts` attempts to assign `profilePictureUrl` to `SignupRequest` type where it's not defined.
    *   `No suitable injection token`: Components cannot inject services, likely linked to `Cannot find module` errors.
    *   `Parameter implicitly has an 'any' type`: Function parameters lack explicit types in several components.
    *   `Property has no initializer`: `@ViewChild` properties in `chat-window.component.ts` lack definite assignment.

## Proposed Plan

Here’s a step-by-step plan to address these issues:

1.  **Fix Module and Export Errors:**
    *   **Step 1.1:** Make `app.config.server.ts` a module by adding `export {};` at the end.
    *   **Step 1.2:** Remove redundant `export { ... };` statements from:
        *   `frontend/src/app/core/guards/auth.guard.ts`
        *   `frontend/src/app/modules/auth/auth.routes.ts`
        *   `frontend/src/app/modules/chat/chat.routes.ts`
        *   `frontend/src/app/modules/matching/matching.routes.ts`
        *   `frontend/src/app/modules/profile/profile.routes.ts`

2.  **Fix TypeScript Type Errors:**
    *   **Step 2.1:** Address `SignupRequest` property mismatch:
        *   Examine `SignupRequest` type definition and corresponding backend DTO (`backend/.../SignupRequest.java`).
        *   *Decision:* Add `profilePictureUrl?: string;` to frontend type OR remove the property assignment in `register.component.ts` based on backend expectation.
    *   **Step 2.2:** Fix missing initializers for `@ViewChild` in `chat-window.component.ts` by adding the non-null assertion operator (`!`).
    *   **Step 2.3:** Add explicit types to parameters (fix implicit `any`) in:
        *   `chat-list.component.ts`
        *   `chat-window.component.ts`
        *   `quick-match.component.ts`
        *   *(Confirm types like `ChatInfoDto`, `ChatMessageDto`, `MatchCardDto` from `.models.ts` files).*

3.  **Final Build Check:**
    *   Run `npm run build` in the `frontend` directory again.
    *   Address any remaining errors, potentially investigating `tsconfig.app.json` or import paths if needed.

## Plan Diagram

```mermaid
graph TD
    subgraph "Phase 1: Module/Export Fixes"
        A[Start: Analyze Errors] --> B(Make app.config.server.ts a module);
        B --> C(Remove Redundant Exports in guards/routes);
    end

    subgraph "Phase 2: TypeScript Type Fixes"
        C --> D{Check SignupRequest Type};
        D -- Backend Expects --> E(Add profilePictureUrl to Frontend Type);
        D -- Backend Ignores --> F(Remove profilePictureUrl from Component);
        E --> G(Fix ViewChild Initializers);
        F --> G;
        G --> H(Add Explicit Types to Parameters);
    end

    subgraph "Phase 3: Verification"
         H --> I(Run npm run build);
         I --> J{Build Successful?};
         J -- Yes --> K[End: Plan Complete];
         J -- No --> L[Further Investigation Needed];
    end