# **IMPORTANT NOTE**

**The `firebase-tools` require Java 21 or higher. Please upgrade your Java version. You can download the latest version of OpenJDK from https://openjdk.java.net/.**

---

# Plan for Next Session (21 Dec 2025)

**Goal:** Get the local development environment running successfully.

**Issue:** We've encountered persistent "port in use" errors when trying to start the Firebase emulators and the Vite frontend server. This is very likely due to an environmental issue on the local machine, where other processes are occupying the default ports (8080, 5173, etc.).

**Steps Taken:**
*   Fixed all frontend unit tests.
*   Attempted to kill the processes using the ports, but they seem to be automatically restarting.
*   Attempted to change the Firestore emulator port to 8081, but that port was also taken.
*   Attempted to run the frontend and backend servers both separately and together using `concurrently`.
*   Attempted to change the Vite frontend server port to 5174.

**Next Steps:**

1.  **Investigate and resolve the port conflict.**
    *   The user will investigate their local machine to identify and stop the process that is occupying ports 8080 and 5173.
    *   If the conflicting process cannot be stopped, we will need to configure the project to use different ports.

2.  **Start the local development environment.**
    *   Once the port conflict is resolved, we will run `npm run start:dev` to start the backend and frontend servers.

3.  **Verify local application functionality.**
    *   We will then proceed with the "Local Application Verification" steps outlined in the original plan below.

---

# Continue Work: Frontend Testing and Local Development

This document outlines the next steps for resuming work on the project, specifically focusing on resolving frontend unit test failures and verifying local application functionality.

## Current Status

All previous improvements (CORS fix, pagination, `joi` validation, backend refactoring, `package.json` cleanup, and initial frontend code review) have been implemented and committed to the `feature/code-improvements` branch.

**Last Action Performed:** Committed frontend changes related to Jest configuration and `SpeechDetail.jsx` refactoring attempts.

**Outstanding Issue:** Frontend unit tests (`SpeechDetail.test.jsx`) are currently failing with:
*   "Rendered more hooks than during the previous render."
*   "Jest encountered an unexpected token."
*   Earlier attempts also encountered "JavaScript heap out of memory."

This indicates a persistent problem with how React hooks are used or mocked within the test environment, possibly exacerbated by Jest's transformation process.

## Next Steps: Detailed Plan

### Phase 1: Debug and Fix Frontend Unit Tests

1.  **Revisit "Rendered more hooks" and `useCallback` / `useEffect` dependencies:**
    *   Carefully review `frontend/src/components/SpeechDetail.jsx` and `frontend/src/hooks/useSpeechAPI.js` to ensure all `useCallback` and `useEffect` hooks have correct and stable dependency arrays.
    *   Investigate the `genAssocId` and `buildDisplayedContent` functions. Ensure they are either memoized correctly (if they are dependencies of hooks) or are not causing unnecessary re-renders or instability within `useCallback`/`useEffect`.
    *   Consider alternative mocking strategies for `buildDisplayedContent` in `SpeechDetail.test.jsx` if it's causing issues.
    *   **Special Note:** The previous attempt to remove `buildDisplayedContent` and `genAssocId` from the `useEffect` dependency array and move `genAssocId` back inside the component was a temporary measure. This needs proper resolution by ensuring hook rules are followed and dependencies are stable.

2.  **Address "Jest encountered an unexpected token" (if still present after hook fixes):**
    *   Confirm `jest.config.cjs`'s `transformIgnorePatterns` correctly includes `@emoji-mart/react` and `@emoji-mart/data`. If the issue persists, further investigate Babel transformation for these modules or other ESM-related conflicts with Jest.

3.  **Resolve "JavaScript heap out of memory" (if still present):**
    *   If memory issues continue, analyze the test setup in `SpeechDetail.test.jsx` for excessive rendering or large data structures being held in memory across tests. Consider breaking down tests further or using `jest.resetModules()` where appropriate.

### Phase 2: Local Application Verification

1.  **Start Backend Emulators:** Run Firebase emulators for `functions`, `auth`, `firestore`, and `database`.
    *   Command: `npm run serve --workspace=backend/functions`
2.  **Start Frontend Development Server:** Run the frontend development server.
    *   Command: `npm run dev --workspace=frontend`
3.  **Verify Functionality:**
    *   Navigate to `http://localhost:5000` (or the appropriate frontend URL).
    *   Log in/Register a new user.
    *   Upload a speech.
    *   Verify speech detail page, emoji association, and toggling functionality.
    *   Test the "Load More" button on the dashboard.
    *   Ensure logout works correctly.

### Phase 3: Final Commit Push

1.  Once all tests pass and local verification is complete, push the `feature/code-improvements` branch to the remote repository.
    *   Command: `git push`

---

**Next Action:** Proceed with Phase 1: Debug and Fix Frontend Unit Tests. Start by carefully reviewing the dependencies of `useEffect` and `useCallback` in `SpeechDetail.jsx` and `useSpeechAPI.js`, keeping the "Rendered more hooks" warning in mind.
