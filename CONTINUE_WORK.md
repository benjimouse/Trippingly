# Continue Work: Code Review Improvements

This document serves as a detailed handover for continuing the implementation of code review suggestions.

## Current Context

We are in the process of implementing improvements based on a thorough code review. All changes are being applied to the `feature/code-improvements` branch.

**Last Action Performed:**
Created the file `backend/functions/middleware/validation.js`.

**Last Completed Code Change:**
Implemented `useReducer` for state management in `frontend/src/components/SpeechDetail.jsx`.
Created `frontend/src/hooks/useSpeechAPI.js` and refactored `frontend/src/components/SpeechDetail.jsx` to use it.
Extracted `buildDisplayedContent` into `frontend/src/utils/speechUtils.js` and updated `frontend/src/components/SpeechDetail.jsx` to import it.

## Next Steps: Detailed Plan (Incomplete Steps)

Below is the detailed plan of the remaining tasks, broken down into atomic steps.

### Phase 2: Refine Backend and Context

#### **4. Create Reusable Validation Middleware (`backend/functions/middleware/validation.js`):**
    *   **Status:** Middleware file created.
    *   **Action Required:** Integrate into `backend/functions/index.js`.
        1.  **Import `validateRequest`:** Add `const { validateRequest } = require('./middleware/validation');` to `backend/functions/index.js`.
        2.  **Define Validation Schema for `/saveEmojiAssociation`:** Create a `saveEmojiAssociationSchema` object defining expected fields, types, and required status.
        3.  **Apply Middleware to `/saveEmojiAssociation`:** Insert `validateRequest(saveEmojiAssociationSchema)` before the route handler.
        4.  **Remove Old Validation for `/saveEmojiAssociation`:** Delete the existing `if` statements for `speechId`, `originalText`, `emoji`, `position`, `cleanSpeech` validation.
        5.  **Define Validation Schema for `/uploadSpeech`:** Create an `uploadSpeechSchema` object.
        6.  **Apply Middleware to `/uploadSpeech`:** Insert `validateRequest(uploadSpeechSchema)` before the route handler.
        7.  **Remove Old Validation for `/uploadSpeech`:** Delete the existing `if` statements for `speechName` and `fileContent` validation.

#### **5. Refactor `AuthContext.jsx` to expose loading state:**
    *   **Status:** Pending.
    *   **Action Required:** Modify `frontend/src/context/AuthContext.jsx`.
        1.  **Add `loading` to Context Value:** Include `loading` in the `value` object provided to `AuthContext.Provider`.
        2.  **Update `useAuth` hook:** Ensure `useAuth` can destructure `loading` directly.

#### **6. Improve `Dashboard.jsx` error handling:**
    *   **Status:** Pending.
    *   **Action Required:** Modify `frontend/src/components/Dashboard.jsx`.
        1.  **Add Toast State:** Introduce `useState` for a `toast` message (similar to `SpeechDetail.jsx`).
        2.  **Replace `alert`:** Replace `alert('Failed to log out!')` with a `setToast` call.
        3.  **Implement Toast UI:** Add JSX for displaying the `toast` message (similar to `SpeechDetail.jsx`).
        4.  **Implement Auto-Dismiss for Toast:** Add a `useEffect` to automatically dismiss the toast after a few seconds.

## Important Notes:

*   **Current Branch:** `feature/code-improvements`
*   **Commit Strategy:** Make separate atomic commits for each major step (e.g., one commit for backend validation, one for AuthContext refactor, etc.).
*   **Dependency Installation:** Remember to run `npm install` in both `frontend/` and `backend/functions/` after significant dependency changes, and *before* testing.
*   **Testing:** Thorough local testing against emulators is crucial after these changes are implemented.