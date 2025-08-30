# Trippingly

Trippingly lets users upload speeches, replace highlighted words or phrases with emojis, and persist those emoji↔text associations. This repo contains a Vite + React frontend and Firebase Cloud Functions (Express) backend using Firestore.

This README explains the project layout, how to run the app locally (frontend + functions), how to run tests, and where to look for the emoji-association logic.

## Project overview

- Frontend: `frontend/` — Vite + React app, Jest + React Testing Library tests.
- Backend: `backend/functions/` — Firebase Cloud Functions (Express) with Firestore via `firebase-admin`.

The core feature added in the current branch is emoji↔text associations with stable `assocId`s, client toggling (emoji vs original text), localStorage persistence, and server-side persistence for associations and toggles.

## Repository structure

- `frontend/` — React app
  - `src/components/SpeechDetail.jsx` — main UI for speech display, selection, emoji replacement, and toggling.
  - `src/test/components/` — unit tests for UI behaviors.
  - `src/setupTests.js` — test setup helpers and warnings filter.

- `backend/functions/` — Firebase Cloud Functions
  - `index.js` — Express app exposing endpoints like `/getSpeech`, `/saveEmojiAssociation`, `/updateAssociationToggle`, `/uploadSpeech`.

## Local development

Prerequisites
- Node.js (tested with Node 20)
- npm
- Firebase CLI (optional, for emulators and deploys)
- A Firebase project with Firestore and Authentication configured (for full end-to-end testing)

Frontend

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Environment variables

- The frontend expects `VITE_CLOUD_FUNCTION_URL` to point to the backend (Cloud Functions) base URL. When running functions locally with the Firebase emulator, set `VITE_CLOUD_FUNCTION_URL` to the functions emulator host (for example, `http://localhost:5001/<project>/us-central1/api`). You can set this in `.env` or export in your shell before starting the frontend.

Backend (Cloud Functions)

1. Install dependencies:

```bash
cd backend/functions
npm install
```

2. Run emulators (recommended for local testing):

```bash
npm run serve
```

This starts the Functions, Auth, and Firestore emulators (if configured). See `firebase.json` and emulator docs for details.

3. Key endpoints

- `GET /getSpeech/:speechId` — fetch a speech owned by the authenticated user.
- `POST /saveEmojiAssociation` — save an emoji association; accepts `assocId` (optional) and `showOriginal`.
- `POST /updateAssociationToggle` — update `showOriginal` for an association.

Authentication

Both frontend and backend calls expect Firebase Authentication tokens. During local development, either sign in through the emulator UI, or mock `currentUser.getIdToken()` in tests.

## Running tests

Frontend tests use Jest + React Testing Library. From the repo root:

```bash
CI=true npm --prefix frontend test
```

The frontend test suite includes tests that mock the emoji picker and network requests.

## Notes for maintainers

- Associations are stored client-side under `localStorage` key `speech_assoc:{speechId}` with shape `{ associations: [...], toggles: { [assocId]: boolean } }`.
- Backend saves associations to Firestore under `users/{userId}/speeches/{speechId}/emojiAssociations` and will use an incoming `assocId` as the document id when provided (idempotent writes).
- Toggle state (`showOriginal`) can be persisted server-side via `POST /updateAssociationToggle`.

## Testing manual changes (quick guide)

1. Start Firestore + Functions emulators locally (if you want to test persistence):

```bash
cd backend/functions
npm run serve
```

2. Start the frontend dev server and set `VITE_CLOUD_FUNCTION_URL` to the emulator URL.

3. Use the UI to upload a speech, select text, replace with emoji, and toggle the association. Check Firestore emulator UI to confirm documents are created under the user's `speeches/{speechId}/emojiAssociations`.

## Next work / TODOs

- Add integration tests using Firebase emulator for end-to-end verification.
- Improve accessibility focus-trap for the emoji picker modal.
- Migrate any remaining legacy localStorage shapes in a migration utility (most migration is handled on-load currently).

## Contribution

1. Open a PR against `main` with a clear description and testing steps.
2. Include unit tests for new behaviors and run the frontend test suite locally.

---
If anything is unclear or you'd like me to add automated CI or emulator-based integration tests, I can add them next.
