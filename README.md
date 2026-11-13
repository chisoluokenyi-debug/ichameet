# IchaMeet

IchaMeet is a worldwide dating-platform project, starting with a responsive web experience and designed to grow into an Android app.

## Current status

This first commit creates the web application foundation and an interactive front-page prototype. It is **not yet a production dating service**: account authentication, persistent profiles, photo uploads, matching, messaging, moderation, and database storage still need to be connected and tested.

## Run locally

- Node.js 20 or newer
- Run `npm install`
- Run `npm run dev`
- Open http://localhost:3000

## Next build milestones

1. Secure sign-up, login, email verification, and age/consent checks.
2. PostgreSQL database and profile management.
3. Profile photos with private storage and moderation.
4. Discovery, likes, mutual matches, and blocking/reporting.
5. Private messaging with abuse controls.
6. Admin moderation tools, privacy policy, terms, and account deletion.
7. Android app using the same authenticated backend/API.

## Security

Never commit passwords, API keys, access tokens, database credentials, or real user data. Keep secrets in the hosting provider's environment-variable settings.
