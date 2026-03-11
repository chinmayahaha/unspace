# Unspace - Deployment Guide

## Project Overview

Unspace is a university web application built with React and Firebase, featuring marketplace, book exchange, community hub, business directory, and promotional services.

## Architecture

- **Frontend**: React 18 with React Router
- **Backend**: Firebase Functions (Node.js 22)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Authentication (Google OAuth)
- **Hosting**: Firebase Hosting

## Prerequisites

- Node.js 22+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Authentication, Firestore, Storage, and Functions enabled

## Environment Setup

### 1. Clone and Install Dependencies

```bash
cd unspace
npm install
cd functions
npm install
```

### 2. Environment Variables

Create `.env` file in root directory:

```env
REACT_APP_API_KEY=your_firebase_api_key
REACT_APP_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_PROJECT_ID=your_project_id
REACT_APP_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_APP_ID=your_app_id
REACT_APP_MEASUREMENT_ID=your_measurement_id
```

Create `.env` file in `functions/` directory:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FRONTEND_URL=http://localhost:3000
```

### 3. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. **Authentication**: Enable Google sign-in
4. **Firestore**: Create database (start in test mode or set rules)
5. **Storage**: Enable storage

## Local Development

### Running Locally

```bash
# Start React frontend
npm start

# Start Firebase emulators (in separate terminal)
cd functions
firebase emulators:start
```

### Firebase Emulator Suite

The project is configured with emulators for:
- Auth (port 9099)
- Functions (port 5001)
- Firestore (port 8080)
- Storage (port 9199)

Access emulator UI at http://localhost:4000

## Deployment

### Option 1: Firebase Hosting (Recommended)

```bash
# Build React app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Option 2: Firebase App Hosting

The project includes `apphosting.yaml` for App Hosting on Cloud Run. Configure in Firebase Console > App Hosting.

### Deploy Firebase Functions

```bash
cd functions
firebase deploy --only functions
```

### Deploy Everything

```bash
# Build and deploy hosting
npm run build
firebase deploy --only hosting

# Deploy functions
cd functions
firebase deploy --only functions
```

## Firebase Console Configuration

### Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable Google provider
3. Add your domain to authorized domains (for production)

### Set Up Firestore

1. Create database in desired region
2. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Set Up Storage

1. Enable Storage in Firebase Console
2. Deploy storage rules:
   ```bash
   firebase deploy --only storage
   ```

## Stripe Integration (Optional)

If using payments:

1. Create Stripe account
2. Get API keys from Stripe Dashboard
3. Add to functions/.env:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
4. Configure webhooks in Stripe dashboard pointing to your deployed functions

## Admin Setup

After deployment, manually add admin users to Firestore:

Collection: `admins/{userId}`
```json
{
  "userId": "user_uid_here",
  "role": "super_admin",
  "permissions": ["all"],
  "assignedBy": "system",
  "createdAt": "timestamp"
}
```

## Troubleshooting

### Common Issues

1. **Function deployment fails**
   - Check Node.js version: `node --version` (should be 22)
   - Verify Firebase CLI: `firebase --version`
   - Check functions/package.json dependencies

2. **Authentication errors**
   - Verify Firebase config in .env
   - Check authorized domains in Firebase Console
   - Ensure Google OAuth is enabled

3. **Firestore permission errors**
   - Check firestore.rules file
   - Verify authentication state

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for ESBuild/Node compatibility issues

### Debug Mode

```bash
# View function logs
cd functions
firebase functions:log

# View hosting logs
firebase hosting:log
```

## Project Structure

```
unspace/
├── src/                    # React frontend
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   ├── features/          # Feature modules
│   └── firebase.js        # Firebase config
├── functions/             # Firebase Functions
│   ├── handlers/         # Feature handlers
│   ├── services/         # Shared services
│   └── index.js          # Entry point
├── public/               # Static assets
├── build/                # Production build
├── firebase.json         # Firebase config
├── apphosting.yaml       # App Hosting config
└── tailwind.config.js    # Tailwind config
```

## CI/CD Setup (GitHub Actions)

Example workflow in `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v1
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: your-project-id
```

## Support

For issues, check:
- Firebase Console > Functions > Logs
- Firebase Console > Analytics > DebugView
- Browser console for frontend errors
