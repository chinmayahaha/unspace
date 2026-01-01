# University Web Application - Complete Documentation

## Project Overview

This is a comprehensive university web application built with Firebase and React, featuring a modular backend architecture and minimal functional frontend. The application provides marketplace, book exchange, community hub, business directory, and promotional services for university students.

## Architecture

### Backend Technologies
- **Firebase Functions (Node.js)**: Main API endpoints and business logic
- **Firebase Authentication**: User authentication and authorization
- **Firestore Database**: NoSQL document database for all data storage
- **Firebase Storage**: File uploads (images, documents)
- **Python Functions**: AI-powered features (OpenAI integration)
- **Stripe**: Payment processing for premium features

### Frontend Technologies
- **React**: User interface framework
- **React Router**: Client-side routing
- **Firebase JS SDK**: Client-side Firebase integration
- **Font Awesome**: Icons and UI elements

## Project Structure

```
unspace/
├── functions/                    # Firebase Functions (Node.js)
│   ├── handlers/                 # Feature-specific handlers
│   │   ├── marketplace.js       # Marketplace functionality
│   │   ├── bookExchange.js      # Book exchange features
│   │   ├── community.js         # Community posts and comments
│   │   ├── businessX.js         # Business directory
│   │   └── adsX.js              # Promotional services
│   ├── services/                # Shared services
│   │   ├── analytics.js         # User analytics tracking
│   │   ├── payments.js          # Stripe payment integration
│   │   └── storage.js           # File upload handling
│   ├── index.js                 # Main functions entry point
│   └── package.json             # Node.js dependencies
├── pythonfunctions/             # Python AI functions
│   ├── main.py                  # AI processing functions
│   └── requirements.txt         # Python dependencies
├── src/                         # React frontend
│   ├── components/              # Reusable React components
│   ├── pages/                   # Page components
│   ├── contexts/                # React contexts (Auth)
│   ├── config/                  # Configuration files
│   └── firebase.js              # Firebase configuration
├── firebase.json               # Firebase project configuration
├── firestore.rules             # Database security rules
├── storage.rules               # Storage security rules
└── FIRESTORE_SCHEMA.md         # Database schema documentation
```

## Features Implemented

### 1. Authentication & User Management
- Google OAuth sign-in with popup
- User profile creation and management
- Admin role management
- Protected routes and authorization

### 2. Marketplace (Buy & Sell)
- Create, read, update, delete listings
- Image upload support
- Category and condition filtering
- Price range filtering
- Search functionality
- Contact seller feature
- Featured listings (paid service)
- AI-generated descriptions

### 3. Book Exchange
- Add books for exchange
- Find matching books
- Exchange request system
- Course-based book organization
- ISBN and edition tracking
- Exchange status management

### 4. Community Hub
- Create and manage posts
- Comment system
- Like/unlike posts
- Category-based organization
- Official announcements (admin)
- Content moderation (AI-powered)
- Search and filtering

### 5. BusinessX (Student Business Directory)
- Business registration and profiles
- Logo upload support
- Review and rating system
- Business verification (admin)
- Category-based organization
- Contact information management

### 6. AdsX (Promotional Services)
- Service request submission
- Creative asset uploads
- Request status management
- Service provider assignment
- Promotion services (paid)
- Multiple service types support

### 7. Analytics Service
- User action tracking
- Comprehensive analytics events
- Admin analytics dashboard
- User behavior insights

### 8. Payment Integration
- Stripe checkout sessions
- Featured listing payments
- Service promotion payments
- Webhook handling
- Order tracking

### 9. AI Features
- Automatic listing description generation
- Content moderation for posts/comments
- OpenAI GPT-3.5 integration
- Asynchronous task processing

## Database Schema

The application uses Firestore with the following main collections:

- **users**: User profiles and preferences
- **listings**: Marketplace items
- **books**: Books available for exchange
- **exchangeRequests**: Book exchange requests
- **posts**: Community posts
- **comments**: Post comments
- **businesses**: Student businesses
- **reviews**: Business reviews
- **serviceRequests**: AdsX service requests
- **analyticsEvents**: User action tracking
- **aiTasks**: AI processing queue
- **orders**: Payment orders
- **admins**: Admin user management

See `FIRESTORE_SCHEMA.md` for detailed schema documentation.

## Setup and Installation

### Prerequisites
- Node.js 20+ and npm
- Python 3.8+
- Firebase CLI
- Firebase project with Authentication, Firestore, Storage, and Functions enabled
- Stripe account
- OpenAI API key

### 1. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init
```

### 2. Environment Variables

Create `.env` files in the appropriate directories:

**Root directory (.env):**
```env
REACT_APP_API_KEY=your_firebase_api_key
REACT_APP_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_PROJECT_ID=your_project_id
REACT_APP_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_APP_ID=your_app_id
REACT_APP_MEASUREMENT_ID=your_measurement_id
```

**Functions directory (.env):**
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FRONTEND_URL=http://localhost:3000
```

**Python functions directory (.env):**
```env
OPENAI_API_KEY=sk-your_openai_api_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account_key.json
```

### 3. Backend Setup

```bash
# Install Node.js dependencies
cd functions
npm install

# Install Python dependencies
cd ../pythonfunctions
pip install -r requirements.txt
```

### 4. Frontend Setup

```bash
# Install React dependencies
npm install
```

### 5. Firebase Configuration

1. **Enable Authentication**: Go to Firebase Console > Authentication > Sign-in method > Enable Google
2. **Create Firestore Database**: Go to Firestore Database > Create database
3. **Set up Storage**: Go to Storage > Get started
4. **Deploy Security Rules**: 
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

### 6. Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up webhook endpoints pointing to your Firebase Functions
4. Configure webhook events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

### 7. OpenAI Setup

1. Create an OpenAI account
2. Generate an API key
3. Add the key to your Python functions environment

## Deployment

### 1. Deploy Firebase Functions

```bash
cd functions
firebase deploy --only functions
```

### 2. Deploy Python Functions

```bash
cd pythonfunctions
# Deploy using Firebase Functions for Python
firebase deploy --only functions:pythonfunctions
```

### 3. Deploy Frontend

```bash
# Build React app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 4. Set up Admin Users

After deployment, manually add admin users to the `admins` collection in Firestore:

```javascript
// Add to admins/{userId}
{
  userId: "user_uid_here",
  role: "super_admin",
  permissions: ["all"],
  assignedBy: "system",
  createdAt: timestamp
}
```

## API Endpoints

### Marketplace Functions
- `createListing(data, context)` - Create new marketplace listing
- `getListing(data, context)` - Get single listing
- `getAllListings(data, context)` - Get listings with filters
- `updateListing(data, context)` - Update listing
- `deleteListing(data, context)` - Delete listing
- `contactSeller(data, context)` - Contact seller about listing
- `featureListing(data, context)` - Feature listing (paid)

### Book Exchange Functions
- `addBookForExchange(data, context)` - Add book for exchange
- `findMatchingBooks(data, context)` - Find matching books
- `initiateExchangeRequest(data, context)` - Start exchange request
- `manageExchangeStatus(data, context)` - Accept/decline exchange
- `getUserExchangeRequests(data, context)` - Get user's exchanges
- `getAllBooks(data, context)` - Get all available books

### Community Functions
- `createPost(data, context)` - Create community post
- `getPosts(data, context)` - Get posts with filters
- `getPost(data, context)` - Get single post
- `deletePost(data, context)` - Delete post
- `addComment(data, context)` - Add comment to post
- `getComments(data, context)` - Get post comments
- `togglePostLike(data, context)` - Like/unlike post
- `postOfficialAnnouncement(data, context)` - Admin announcements

### BusinessX Functions
- `registerBusiness(data, context)` - Register new business
- `getBusinessProfile(data, context)` - Get business details
- `getAllBusinesses(data, context)` - Get businesses with filters
- `updateBusinessProfile(data, context)` - Update business
- `addReview(data, context)` - Add business review
- `getReviews(data, context)` - Get business reviews
- `verifyBusiness(data, context)` - Verify business (admin)

### AdsX Functions
- `submitServiceRequest(data, context)` - Submit service request
- `getRequests(data, context)` - Get service requests
- `updateRequestStatus(data, context)` - Update request status
- `assignRequest(data, context)` - Assign request to provider
- `promoteRequest(data, context)` - Promote request (paid)
- `getRequestDetails(data, context)` - Get request details

## Security

### Firestore Security Rules
The application implements comprehensive security rules ensuring:
- Users can only access their own data
- Public data is readable by all authenticated users
- Admin functions are restricted to admin users
- Analytics data is write-only for users

### Authentication
- All API endpoints require authentication
- User ownership validation for all operations
- Admin role checking for administrative functions

## Monitoring and Analytics

### Built-in Analytics
- User action tracking across all features
- Performance monitoring
- Error logging and reporting
- Custom analytics events

### Firebase Analytics
- Automatic user behavior tracking
- Custom event tracking
- Conversion tracking
- User journey analysis

## Testing

### Backend Testing
```bash
cd functions
npm test
```

### Frontend Testing
```bash
npm test
```

### Integration Testing
Use Firebase emulators for local testing:
```bash
firebase emulators:start
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Firebase configuration
   - Verify Google OAuth setup
   - Ensure proper domain configuration

2. **Function Deployment Issues**
   - Check Node.js version compatibility
   - Verify environment variables
   - Check Firebase project permissions

3. **Database Permission Errors**
   - Verify Firestore security rules
   - Check user authentication status
   - Ensure proper data structure

4. **Payment Integration Issues**
   - Verify Stripe API keys
   - Check webhook configuration
   - Ensure proper error handling

### Debug Mode
Enable debug logging by setting environment variables:
```env
DEBUG=true
FIREBASE_DEBUG=true
```

## Performance Optimization

### Backend Optimizations
- Function cold start optimization
- Database query optimization
- Image compression and resizing
- Caching strategies

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Progressive web app features

## Future Enhancements

### Planned Features
- Real-time chat system
- Mobile app development
- Advanced analytics dashboard
- Machine learning recommendations
- Video call integration
- Advanced payment options

### Scalability Considerations
- Database sharding strategies
- CDN implementation
- Microservices architecture
- Load balancing
- Caching layers

## Support and Maintenance

### Regular Maintenance Tasks
- Security updates
- Dependency updates
- Performance monitoring
- Backup verification
- Error log analysis

### Monitoring Setup
- Set up Firebase Performance Monitoring
- Configure error reporting
- Set up uptime monitoring
- Implement health checks

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Test thoroughly
5. Submit pull request

### Code Standards
- Follow ESLint configuration
- Use TypeScript for new features
- Write comprehensive tests
- Document all functions
- Follow naming conventions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions and support, please contact the development team or create an issue in the repository.

---

**Note**: This documentation covers the complete implementation of the university web application. All features are functional and ready for deployment with proper configuration of the required services.
