# Firestore Database Schema Design

## Overview
This document outlines the comprehensive Firestore database schema for the University Web Application. The schema supports all core features including marketplace, book exchange, community hub, business directory, ads agency, analytics, AI tasks, and payment processing.

## Collections Structure

### 1. Users Collection (`users`)
**Purpose**: Store user profile information and preferences

```javascript
users/{userId} {
  email: string,
  name: string,
  photoURL: string,
  university: string,
  major: string,
  year: string,
  bio: string,
  preferences: {
    notifications: boolean,
    emailUpdates: boolean,
    privacy: string
  },
  stats: {
    listingsCount: number,
    exchangesCount: number,
    postsCount: number,
    reviewsCount: number
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  lastActiveAt: timestamp
}
```

### 2. Listings Collection (`listings`)
**Purpose**: Marketplace items for buy/sell

```javascript
listings/{listingId} {
  id: string,
  title: string,
  description: string,
  aiDescription: string, // AI-generated description
  price: number,
  category: string, // electronics, books, furniture, etc.
  condition: string, // new, like_new, good, fair, poor
  images: string[], // Array of image URLs
  sellerId: string, // Reference to users collection
  status: string, // active, sold, deleted, pending
  featured: boolean,
  featuredUntil: timestamp,
  location: {
    building: string,
    room: string,
    coordinates: geopoint
  },
  tags: string[],
  viewCount: number,
  interestCount: number,
  createdAt: timestamp,
  updatedAt: timestamp,
  soldAt: timestamp,
  aiGeneratedAt: timestamp
}
```

### 3. Books Collection (`books`)
**Purpose**: Books available for exchange

```javascript
books/{bookId} {
  id: string,
  title: string,
  author: string,
  isbn: string,
  edition: string,
  condition: string,
  description: string,
  imageUrl: string,
  ownerId: string, // Reference to users collection
  status: string, // available, exchanged, reserved
  course: string, // Course code if applicable
  semester: string,
  price: number, // Optional selling price
  createdAt: timestamp,
  updatedAt: timestamp,
  exchangedAt: timestamp
}
```

### 4. Exchange Requests Collection (`exchangeRequests`)
**Purpose**: Track book exchange requests

```javascript
exchangeRequests/{exchangeId} {
  id: string,
  requesterId: string, // User requesting exchange
  targetBookId: string, // Book they want
  offeredBookId: string, // Book they're offering
  targetOwnerId: string, // Owner of target book
  message: string,
  status: string, // pending, accepted, declined, completed
  meetingLocation: string,
  meetingTime: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  acceptedAt: timestamp,
  declinedAt: timestamp,
  completedAt: timestamp
}
```

### 5. Posts Collection (`posts`)
**Purpose**: Community posts and announcements

```javascript
posts/{postId} {
  id: string,
  title: string,
  content: string,
  category: string, // general, academic, social, events, etc.
  tags: string[],
  imageUrl: string,
  authorId: string, // Reference to users collection
  status: string, // active, deleted, under_review
  official: boolean, // Admin announcements
  priority: string, // normal, high, urgent
  likes: number,
  comments: number,
  moderated: boolean,
  moderationResult: object,
  moderatedAt: timestamp,
  moderationFlag: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp
}
```

### 6. Comments Collection (`comments`)
**Purpose**: Comments on posts

```javascript
comments/{commentId} {
  id: string,
  postId: string, // Reference to posts collection
  content: string,
  authorId: string, // Reference to users collection
  parentCommentId: string, // For nested comments
  status: string, // active, deleted, under_review
  likes: number,
  moderated: boolean,
  moderationResult: object,
  moderatedAt: timestamp,
  moderationFlag: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp
}
```

### 7. Post Likes Collection (`post_likes`)
**Purpose**: Track post likes

```javascript
post_likes/{postId_userId} {
  postId: string,
  userId: string,
  createdAt: timestamp
}
```

### 8. Businesses Collection (`businesses`)
**Purpose**: Student business directory

```javascript
businesses/{businessId} {
  id: string,
  name: string,
  description: string,
  category: string, // tutoring, photography, design, etc.
  contactEmail: string,
  contactPhone: string,
  address: string,
  website: string,
  socialMedia: {
    instagram: string,
    facebook: string,
    twitter: string
  },
  logoUrl: string,
  ownerId: string, // Reference to users collection
  status: string, // active, inactive, suspended
  verified: boolean,
  verifiedAt: timestamp,
  verifiedBy: string, // Admin user ID
  rating: number, // Average rating
  reviewCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 9. Reviews Collection (`reviews`)
**Purpose**: Business reviews

```javascript
reviews/{reviewId} {
  id: string,
  businessId: string, // Reference to businesses collection
  userId: string, // Reference to users collection
  rating: number, // 1-5 stars
  comment: string,
  status: string, // active, deleted, flagged
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 10. Service Requests Collection (`serviceRequests`)
**Purpose**: AdsX service requests

```javascript
serviceRequests/{requestId} {
  id: string,
  serviceType: string, // design, video, content, social_media, marketing
  title: string,
  description: string,
  budget: number,
  timeline: string,
  requirements: string[],
  creativeAssets: string[], // Array of asset URLs
  clientId: string, // Reference to users collection
  status: string, // pending, in_progress, completed, cancelled
  assignedTo: string, // Service provider user ID
  promoted: boolean,
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  assignedAt: timestamp,
  completedAt: timestamp,
  cancelledAt: timestamp
}
```

### 11. Analytics Events Collection (`analyticsEvents`)
**Purpose**: Track user actions and behavior

```javascript
analyticsEvents/{eventId} {
  userId: string, // Reference to users collection
  action: string, // listing_created, post_viewed, etc.
  details: object, // Action-specific data
  metadata: {
    timestamp: timestamp,
    userAgent: string,
    ipAddress: string,
    sessionId: string,
    page: string,
    referrer: string
  },
  createdAt: timestamp
}
```

### 12. AI Tasks Collection (`aiTasks`)
**Purpose**: Queue AI processing tasks

```javascript
aiTasks/{taskId} {
  type: string, // generateListingDescription, moderateContent
  status: string, // pending, processing, completed, failed
  listingId: string, // For listing description tasks
  contentId: string, // For content moderation tasks
  contentType: string, // post, comment
  result: object, // AI processing result
  error: string, // Error message if failed
  createdAt: timestamp,
  startedAt: timestamp,
  completedAt: timestamp,
  failedAt: timestamp
}
```

### 13. Orders Collection (`orders`)
**Purpose**: Track payment orders

```javascript
orders/{orderId} {
  userId: string, // Reference to users collection
  type: string, // listing_featured, ads_promotion
  itemId: string, // ID of the item being paid for
  amount: number, // Amount in cents
  description: string,
  status: string, // pending, completed, failed, refunded
  stripeSessionId: string,
  stripePaymentIntentId: string,
  createdAt: timestamp,
  completedAt: timestamp,
  failedAt: timestamp,
  failureReason: string
}
```

### 14. Listing Interests Collection (`listing_interests`)
**Purpose**: Track buyer interest in listings

```javascript
listing_interests/{interestId} {
  listingId: string, // Reference to listings collection
  buyerId: string, // Reference to users collection
  sellerId: string, // Reference to users collection
  message: string,
  status: string, // pending, responded, closed
  createdAt: timestamp,
  respondedAt: timestamp
}
```

### 15. Admins Collection (`admins`)
**Purpose**: Admin user management

```javascript
admins/{adminId} {
  userId: string, // Reference to users collection
  role: string, // super_admin, moderator, support
  permissions: string[],
  assignedBy: string, // Admin who granted access
  createdAt: timestamp,
  lastActiveAt: timestamp
}
```

## Indexes Required

### Composite Indexes for Firestore
The following composite indexes need to be created in Firestore:

1. **Listings Collection**:
   - `status` + `createdAt` (desc)
   - `category` + `status` + `createdAt` (desc)
   - `sellerId` + `status` + `createdAt` (desc)
   - `featured` + `createdAt` (desc)

2. **Posts Collection**:
   - `status` + `createdAt` (desc)
   - `category` + `status` + `createdAt` (desc)
   - `authorId` + `status` + `createdAt` (desc)
   - `official` + `priority` + `createdAt` (desc)

3. **Comments Collection**:
   - `postId` + `status` + `createdAt` (asc)
   - `authorId` + `status` + `createdAt` (desc)

4. **Books Collection**:
   - `status` + `createdAt` (desc)
   - `ownerId` + `status` + `createdAt` (desc)
   - `course` + `status` + `createdAt` (desc)

5. **Exchange Requests Collection**:
   - `requesterId` + `status` + `createdAt` (desc)
   - `targetOwnerId` + `status` + `createdAt` (desc)

6. **Businesses Collection**:
   - `status` + `verified` + `createdAt` (desc)
   - `category` + `status` + `rating` (desc)
   - `ownerId` + `status` + `createdAt` (desc)

7. **Reviews Collection**:
   - `businessId` + `status` + `createdAt` (desc)
   - `userId` + `status` + `createdAt` (desc)

8. **Service Requests Collection**:
   - `clientId` + `status` + `createdAt` (desc)
   - `assignedTo` + `status` + `createdAt` (desc)
   - `serviceType` + `status` + `createdAt` (desc)

9. **Analytics Events Collection**:
   - `userId` + `action` + `createdAt` (desc)
   - `action` + `createdAt` (desc)

10. **Orders & AI Tasks**:
  - `status` + `createdAt` (desc) for `orders`
  - `stripeSessionId` + `status` (desc) for `orders` (optional)
  - `type` + `status` + `createdAt` (desc) for `aiTasks`

11. **Listing Interests**:
  - `listingId` + `createdAt` (asc)

12. **Notifications & Messages**:
  - `userId` + `read` + `createdAt` (desc) for `notifications`
  - `conversationId` + `createdAt` (asc) for `messages`

## Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listings are readable by all, writable by owner
    match /listings/{listingId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.sellerId || 
         request.auth.uid == request.resource.data.sellerId);
    }
    
    // Posts are readable by all, writable by author
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.authorId || 
         request.auth.uid == request.resource.data.authorId);
    }
    
    // Comments follow same pattern as posts
    match /comments/{commentId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.authorId || 
         request.auth.uid == request.resource.data.authorId);
    }
    
    // Books readable by all, writable by owner
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || 
         request.auth.uid == request.resource.data.ownerId);
    }
    
    // Exchange requests readable by participants
    match /exchangeRequests/{exchangeId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.requesterId || 
         request.auth.uid == resource.data.targetOwnerId ||
         request.auth.uid == request.resource.data.requesterId ||
         request.auth.uid == request.resource.data.targetOwnerId);
    }
    
    // Businesses readable by all, writable by owner
    match /businesses/{businessId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || 
         request.auth.uid == request.resource.data.ownerId);
    }
    
    // Reviews readable by all, writable by author
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
    
    // Service requests readable by client and assigned provider
    match /serviceRequests/{requestId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.clientId || 
         request.auth.uid == resource.data.assignedTo ||
         request.auth.uid == request.resource.data.clientId ||
         request.auth.uid == request.resource.data.assignedTo);
    }
    
    // Analytics events writable by authenticated users
    match /analyticsEvents/{eventId} {
      allow write: if request.auth != null;
      allow read: if false; // Only backend can read analytics
    }
    
    // AI tasks writable by backend only
    match /aiTasks/{taskId} {
      allow read, write: if false; // Only backend functions
    }
    
    // Orders readable by owner
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
    
    // Admin collection accessible only by admins
    match /admins/{adminId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## Additional Collections (recommended)

### Notifications Collection (`notifications`)
Purpose: Store user-directed notifications (in-app)

```javascript
notifications/{notificationId} {
  id: string,
  userId: string, // Recipient user ID
  title: string,
  body: string,
  link: string, // Optional deep link
  read: boolean,
  type: string, // info, warning, action
  meta: object, // Extra contextual data
  createdAt: timestamp,
  deliveredAt: timestamp,
  seenAt: timestamp
}
```

### Messages & Conversations (`conversations`, `messages`)
Purpose: Optional direct messaging between users or for support

```javascript
conversations/{conversationId} {
  id: string,
  participants: string[], // [userId1, userId2]
  title: string,
  lastMessageAt: timestamp,
  unreadCounts: { userId: number },
  createdAt: timestamp,
  updatedAt: timestamp
}

messages/{messageId} {
  id: string,
  conversationId: string,
  senderId: string,
  body: string,
  attachments: string[], // storage URLs
  createdAt: timestamp,
  deliveredAt: timestamp,
  readAt: timestamp
}
```

### Storage Metadata (`files`)
Purpose: Track uploaded files and metadata outside of Storage bucket metadata

```javascript
files/{fileId} {
  id: string,
  ownerId: string,
  originalName: string,
  storagePath: string,
  publicUrl: string,
  mimeType: string,
  size: number,
  tags: string[],
  createdAt: timestamp
}
```

### Webhook Logs (`webhookLogs`)
Purpose: Store incoming webhook events (Stripe, external integrations) for auditing

```javascript
webhookLogs/{logId} {
  id: string,
  source: string, // stripe, mailgun, etc.
  eventType: string,
  payload: object,
  status: string, // received, processed, failed
  createdAt: timestamp,
  processedAt: timestamp,
  error: string
}
```

## Storage Security Notes

Add rules to `storage.rules` to restrict access to user-owned files and bucket paths used for public listing images. For example, require that writes to `/user_uploads/{userId}/{allPaths=**}` are only allowed when the authenticated UID matches `userId`. Public listing images can be written by backend functions and set to publicly readable via signed URLs or bucket policies.

## Operational Notes

- AI tasks must be written by a trusted backend (Cloud Function with Admin SDK). The `aiTasks` document is intentionally private in rules. When the Python AI processor runs (Cloud Function or Cloud Run service account), it should use Admin credentials to read/write `aiTasks` and update the corresponding resource (for example, set `aiTasks/{id}.result` and update `listings/{listingId}.aiDescription`).
- Stripe webhooks should be written to `webhookLogs` and then processed server-side. Do not expose webhook secrets to the client.
- Keep security rules strict for analytics and aiTasks; use Cloud Functions to aggregate analytics for reporting rather than client reads.

## Data Relationships

### Key Relationships:
1. **Users** → **Listings** (One-to-Many via `sellerId`)
2. **Users** → **Books** (One-to-Many via `ownerId`)
3. **Users** → **Posts** (One-to-Many via `authorId`)
4. **Users** → **Comments** (One-to-Many via `authorId`)
5. **Users** → **Businesses** (One-to-Many via `ownerId`)
6. **Users** → **Reviews** (One-to-Many via `userId`)
7. **Users** → **Service Requests** (One-to-Many via `clientId`)
8. **Posts** → **Comments** (One-to-Many via `postId`)
9. **Businesses** → **Reviews** (One-to-Many via `businessId`)
10. **Listings** → **Listing Interests** (One-to-Many via `listingId`)

## Data Validation

### Required Fields:
- All collections require `createdAt` timestamp
- User references must be valid UIDs
- Status fields must use predefined values
- Rating fields must be within valid ranges (1-5)

### Data Types:
- Timestamps: Firestore ServerTimestamp
- Numbers: Integer/Float as appropriate
- Booleans: True/False
- Arrays: String arrays for tags, URLs
- Objects: Nested objects for complex data
- Geopoints: For location data

This schema provides a comprehensive foundation for all features while maintaining data integrity, security, and performance optimization through proper indexing.
