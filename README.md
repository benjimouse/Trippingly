# Trippingly

Trippingly lets users upload speeches, replace highlighted words or phrases with emojis, and persist those emoji↔text associations. This repo contains a Vite + React frontend and Firebase Cloud Functions (Express) backend using Firestore.

This README explains the project layout, how to run the app locally (frontend + functions), how to run tests, and where to look for the emoji-association logic.

## Project overview

-   **Frontend**: `frontend/` — Vite + React app, Jest + React Testing Library tests.
-   **Backend**: `backend/functions/` — Firebase Cloud Functions (Express) with Firestore via `firebase-admin`.

The core feature added in the current branch is emoji↔text associations with stable `assocId`s, client toggling (emoji vs original text), localStorage persistence, and server-side persistence for associations and toggles.

## Repository structure

-   `frontend/` — React app
    -   `src/components/SpeechDetail.jsx` — main UI for speech display, selection, emoji replacement, and toggling.
    -   `src/test/components/` — unit tests for UI behaviors.
    -   `src/setupTests.js` — test setup helpers and warnings filter.
-   `backend/functions/` — Firebase Cloud Functions
    -   `index.js` — Express app exposing endpoints like `/getSpeech`, `/saveEmojiAssociation`, `/updateAssociationToggle`, `/uploadSpeech`.

## Local development

### Prerequisites

-   **Node.js**: (tested with Node 20)
-   **npm**: (comes with Node.js)
-   **Java Development Kit (JDK)**: Version 21 or higher. This is a requirement for the Firebase emulators. You can download it from [OpenJDK](https://openjdk.java.net/) or install it using a package manager like [Homebrew](https://brew.sh/) (`brew install openjdk@21`).
-   **Firebase CLI (`firebase-tools`)**: Recommended for running the local emulators and deploying functions. Install with `npm install -g firebase-tools`.
-   **A Firebase project**: with Firestore and Authentication configured for full end-to-end testing.

### Running the application

The easiest way to run the application locally is to use the `start:dev` script from the root of the project:

```bash
npm run start:dev
```

This will start both the frontend and backend servers concurrently.

**Frontend:**

The frontend will be running at `http://localhost:5173`.

**Backend:**

The backend emulators will be running on the following ports:

-   **Authentication**: `9099`
-   **Functions**: `5001`
-   **Firestore**: `8095` (or as configured in `firebase.json`)
-   **Database**: `9000`
-   **Emulator UI**: `4000`

### Environment variables

The frontend expects `VITE_CLOUD_FUNCTION_URL` to point to the backend (Cloud Functions) base URL. When running functions locally with the Firebase emulator, set `VITE_CLOUD_FUNCTION_URL` to the functions emulator host. You can do this by creating a `.env.local` file in the `frontend/` directory with the following content:

```
VITE_CLOUD_FUNCTION_URL="http://127.0.0.1:5001/trippingly-on-the-tongue/us-central1/api"
```

### Authentication

Both frontend and backend calls expect Firebase Authentication tokens. During local development with the emulators, you can sign in through the emulator UI at `http://127.0.0.1:4000/auth`.

If your credentials expire or you run into authentication issues, use `firebase login --reauth` to refresh them.

## Running tests

Frontend tests use Jest + React Testing Library. From the repo root:

```bash
CI=true npm --prefix frontend test
```

The frontend test suite includes tests that mock the emoji picker and network requests.

## Debugging

Common issues and quick fixes:

-   **"Command not found: firebase"**: install the Firebase CLI with `npm install -g firebase-tools` or use `npx firebase`.
-   **"firebase-tools no longer supports Java version before 21"**: You need to install Java 21 or higher. See the "Prerequisites" section for more details.
-   **Wrong `VITE_CLOUD_FUNCTION_URL`**: the Functions emulator prints the exact URL; set `VITE_CLOUD_FUNCTION_URL` to that value (include the `/api` path if your functions are exported under `api`).
-   **Auth/401 errors when calling emulated functions**: sign in with the emulator Auth UI or ensure your test auth token is valid; in unit tests mocking `currentUser.getIdToken()` is convenient.
-   **CORS errors**: Make sure that the frontend's origin (`http://localhost:5173`) is included in the `allowedOrigins` array in `backend/functions/index.js`.
-   **Firestore permission/404 errors**: check the emulator logs and that you are using the right `projectId` in the emulator config.
-   **Failing tests due to environment differences**: ensure Node and npm versions are compatible with the project's devDependencies and that `npm install` has been run in `frontend/`.