# Feature-First Refactoring Guide

## Step 1: Run the PowerShell Script

```powershell
# From project root
.\refactor-to-features.ps1
```

Or run commands manually (see below).

## Step 2: Manual Commands (Alternative)

### Create Directories
```powershell
New-Item -ItemType Directory -Force -Path "src/features/business/pages"
New-Item -ItemType Directory -Force -Path "src/features/community/pages"
New-Item -ItemType Directory -Force -Path "src/features/ads/pages"
New-Item -ItemType Directory -Force -Path "src/components/ui"
New-Item -ItemType Directory -Force -Path "src/lib"
```

### Move Business Feature Files
```powershell
Move-Item "src/pages/BusinessXPage.js" "src/features/business/pages/" -Force
Move-Item "src/pages/BusinessXPage.css" "src/features/business/pages/" -Force
Move-Item "src/pages/RegisterBusinessPage.js" "src/features/business/pages/" -Force
Move-Item "src/pages/RegisterBusinessPage.css" "src/features/business/pages/" -Force
Move-Item "src/pages/BusinessDetailPage.js" "src/features/business/pages/" -Force
Move-Item "src/pages/BusinessDetailPage.css" "src/features/business/pages/" -Force
```

### Move Community Feature Files
```powershell
Move-Item "src/pages/CommunityPage.js" "src/features/community/pages/" -Force
Move-Item "src/pages/CommunityPage.css" "src/features/community/pages/" -Force
Move-Item "src/pages/PostDetailPage.js" "src/features/community/pages/" -Force
Move-Item "src/pages/PostDetailPage.css" "src/features/community/pages/" -Force
Move-Item "src/pages/CreatePostPage.js" "src/features/community/pages/" -Force
Move-Item "src/pages/CreatePostPage.css" "src/features/community/pages/" -Force
```

### Move Ads Feature Files
```powershell
Move-Item "src/pages/AdsXPage.js" "src/features/ads/pages/" -Force
Move-Item "src/pages/AdsXPage.css" "src/features/ads/pages/" -Force
Move-Item "src/pages/SubmitRequestPage.js" "src/features/ads/pages/" -Force
Move-Item "src/pages/SubmitRequestPage.css" "src/features/ads/pages/" -Force
Move-Item "src/pages/RequestDetailPage.js" "src/features/ads/pages/" -Force
Move-Item "src/pages/RequestDetailPage.css" "src/features/ads/pages/" -Force
```

### Move Library Files
```powershell
Move-Item "src/firebase.js" "src/lib/" -Force
```

## Step 3: Update App.js Imports

See `App.js` file for updated imports.

## Step 4: Files That Need Import Updates

### Business Feature Files
- `src/features/business/pages/BusinessXPage.js`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../../../lib/firebase'`
  - Update: `import Card from '../components/ui/Card'` → `import Card from '../../../components/ui/Card'`
  - Update: `import Button from '../components/ui/Button'` → `import Button from '../../../components/ui/Button'`
  - Update: `import LoadingScreen from '../components/ui/LoadingScreen'` → `import LoadingScreen from '../../../components/ui/LoadingScreen'`
  - Update: `import { useAuth } from '../features/auth/context/AuthContext'` → `import { useAuth } from '../../../features/auth/context/AuthContext'`

- `src/features/business/pages/RegisterBusinessPage.js`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../../../lib/firebase'`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

- `src/features/business/pages/BusinessDetailPage.js`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

### Community Feature Files
- `src/features/community/pages/CommunityPage.js`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../../../lib/firebase'`
  - Update: `import Card from '../components/ui/Card'` → `import Card from '../../../components/ui/Card'`
  - Update: `import Button from '../components/ui/Button'` → `import Button from '../../../components/ui/Button'`
  - Update: `import LoadingScreen from '../components/ui/LoadingScreen'` → `import LoadingScreen from '../../../components/ui/LoadingScreen'`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

- `src/features/community/pages/PostDetailPage.js`
  - Update: `import { useAuth } from '../contexts/AuthContext'` → `import { useAuth } from '../../../features/auth/context/AuthContext'`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../../../lib/firebase'`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

- `src/features/community/pages/CreatePostPage.js`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../../../lib/firebase'`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

### Ads Feature Files
- `src/features/ads/pages/AdsXPage.js`
  - Update: `import { useAuth } from '../contexts/AuthContext'` → `import { useAuth } from '../../../features/auth/context/AuthContext'`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../../../lib/firebase'`
  - Update: `import Card from '../components/UI/Card'` → `import Card from '../../../components/ui/Card'`
  - Update: `import Button from '../components/UI/Button'` → `import Button from '../../../components/ui/Button'`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

- `src/features/ads/pages/SubmitRequestPage.js`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../../../lib/firebase'`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

- `src/features/ads/pages/RequestDetailPage.js`
  - Update: `import { ICONS } from '../config/icons'` → `import { ICONS } from '../../../config/icons'`

### Other Files That Import firebase.js
- `src/features/auth/pages/SignIn.js`
  - Update: `import { auth } from '../firebase'` → `import { auth } from '../../../lib/firebase'`

- `src/features/auth/context/AuthContext.js`
  - Update: `import { auth, db, firebaseConfigured } from '../firebase'` → `import { auth, db, firebaseConfigured } from '../../../lib/firebase'`

- `src/features/marketplace/pages/MarketplacePage.js`
  - Update: `import { functions, firebaseConfigured } from '../../../firebase'` → `import { functions, firebaseConfigured } from '../../../lib/firebase'`

- `src/features/marketplace/pages/CreateListingPage.js`
  - Update: `import { functions } from '../../../firebase'` → `import { functions } from '../../../lib/firebase'`

- `src/pages/BookExchangePage.js`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../lib/firebase'`

- `src/pages/AddBookPage.js`
  - Update: `import { functions } from '../firebase'` → `import { functions } from '../lib/firebase'`

- `src/pages/Dashboard.js`
  - (No firebase import, but check for other relative paths)

- `src/components/GoogleAuth.js`
  - Update: `import { auth } from '../firebase'` → `import { auth } from '../lib/firebase'`

- `src/components/layout/Navigation.js`
  - (Already updated, but verify)

## Import Path Patterns to Update

### Old → New Patterns:
1. `'../firebase'` → `'../../../lib/firebase'` (from feature pages)
2. `'../firebase'` → `'../../lib/firebase'` (from pages/)
3. `'../components/UI/Card'` → `'../../../components/ui/Card'` (from feature pages)
4. `'../components/ui/Card'` → `'../../../components/ui/Card'` (from feature pages)
5. `'../contexts/AuthContext'` → `'../../../features/auth/context/AuthContext'` (from feature pages)
6. `'../config/icons'` → `'../../../config/icons'` (from feature pages)

## Final Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── pages/ (SignIn.js, SignUp.js)
│   │   ├── context/ (AuthContext.js)
│   │   └── components/ (ProtectedRoute.js)
│   ├── marketplace/
│   │   └── pages/ (MarketplacePage.js, ListingDetailPage.js, CreateListingPage.js)
│   ├── business/
│   │   └── pages/ (BusinessXPage.js, RegisterBusinessPage.js, BusinessDetailPage.js)
│   ├── community/
│   │   └── pages/ (CommunityPage.js, PostDetailPage.js, CreatePostPage.js)
│   └── ads/
│       └── pages/ (AdsXPage.js, SubmitRequestPage.js, RequestDetailPage.js)
├── components/
│   ├── layout/ (Navigation.js)
│   └── ui/ (Button.js, Card.js, LoadingScreen.js, Lightbox.js)
├── lib/ (firebase.js)
└── styles/ (global.css)
```

