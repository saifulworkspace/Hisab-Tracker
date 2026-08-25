# Hisab Tracker: GitHub Pages + Firebase

This build is a static React client. Firebase Authentication identifies each user, and Firestore stores finance records under `users/{uid}/receivables`, `users/{uid}/payables`, and `users/{uid}/properties`. There is no seed data: every new account begins with 0 / নিল.

## Firebase console setup

Create or use a Firebase project, register a Web App, and copy its six browser configuration values into the GitHub repository secrets with the exact names `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`.

Enable **Authentication → Sign-in method → Email/Password**. Enable **Google** only if Google sign-in is desired. Add the final GitHub Pages hostname to **Authentication → Settings → Authorized domains**.

Create a **Cloud Firestore** database and publish the rules in `firestore.rules`. The rule requires a signed-in user and permits access only when the document path contains the same Firebase UID as `request.auth.uid`.

## GitHub Pages setup

Push this repository to GitHub. In **Settings → Pages**, select **GitHub Actions** as the source. Add the six `VITE_FIREBASE_*` values under **Settings → Secrets and variables → Actions → Secrets**. Push to the `main` branch or run the `Deploy Hisab Tracker to GitHub Pages` workflow manually.

The workflow runs `pnpm run build:pages`, automatically uses the repository subpath as the Vite base path, and publishes `dist/public`.

## Local development

Set the same six `VITE_FIREBASE_*` variables in a local environment file that is not committed, then run `pnpm install` followed by `pnpm run dev`. Never add Firebase Admin SDK credentials or private service-account keys to this frontend repository. Firebase Web API keys are browser configuration values; Firestore Rules and Authentication are the access controls.

## Privacy and behavior

Each authenticated user's data is isolated by Firebase UID. Data listeners use Firestore `onSnapshot`, so changes made in one browser session appear in that user's other sessions without a manual refresh. New users are not given the previous sample entries. They see 0 / নিল until they add their own records.
