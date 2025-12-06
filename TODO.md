# Project Improvement Plan

This document outlines a plan to improve the Trippingly project, focusing on security, performance, and code quality.

## High Priority

- [x] **Address Critical CORS Security Vulnerability:** The `cors({ origin: true })` configuration in `backend/functions/index.js` allows all origins, which is a major security risk in a production environment. This will be changed to only allow the frontend's domain.
- [x] **Fix Performance Bottleneck in `/getSpeeches`:** The current implementation fetches all speeches for a user, which can be inefficient. Pagination will be implemented to fetch speeches in batches.
- [x] **Replace Custom Validation Middleware:** The custom validation middleware is simplistic. It will be replaced with a more robust library like `joi` to improve security and maintainability.
- [x] **Review `firestore.rules`:** The `firestore.rules` file is critical for database security. It will be audited to ensure that users can only access their own data.

## Medium Priority

- [x] **Refactor Backend API:** All the backend logic is in a single file, which makes it hard to maintain. The API will be broken into modular routers.
- [x] **Clean Up `package.json` files:** The root `package.json` file has mixed dependencies. This will be cleaned up to have a more organized monorepo structure.
- [x] **Review Frontend Code:** The frontend code, especially `useSpeechAPI.js`, will be reviewed for proper error handling, loading state management, and efficient data fetching.
