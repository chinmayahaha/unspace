# UnSpace - University Web Application

A comprehensive university web application built with Firebase and React, featuring marketplace, book exchange, community hub, business directory, and promotional services.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.8+
- Firebase CLI
- Firebase project with Authentication, Firestore, Storage, and Functions enabled
- Stripe account
- OpenAI API key

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd unspace
   npm install
   ```

2. **Configure Firebase**
   ```bash
   firebase login
   firebase init
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in root directory
   - Copy `.env.example` to `.env` in `functions/` directory
   - Copy `.env.example` to `.env` in `pythonfunctions/` directory
   - Fill in your API keys and configuration

4. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd functions && npm install
   
   # Python AI functions
   cd ../pythonfunctions && pip install -r requirements.txt
   ```

5. **Deploy**
   ```bash
   # Deploy functions
   firebase deploy --only functions
   
   # Build and deploy frontend
   npm run build
   firebase deploy --only hosting
   ```

## 📋 Features

### ✅ Implemented Features

- **Authentication System**
  - Google OAuth sign-in
  - User profile management
  - Admin role system
  - Protected routes

- **Marketplace**
  - Create/edit/delete listings
  - Image upload support
  - Search and filtering
  - Contact seller functionality
  - Featured listings (paid)
  - AI-generated descriptions

- **Book Exchange**
  - Add books for exchange
  - Find matching books
  - Exchange request system
  - Course-based organization

- **Community Hub**
  - Create posts and comments
  - Like system
  - Category organization
  - Official announcements
  - AI content moderation

- **BusinessX Directory**
  - Business registration
  - Review and rating system
  - Business verification
  - Logo upload support

- **AdsX Services**
  - Service request submission
  - Creative asset uploads
  - Request management
  - Promotion services (paid)

- **Analytics & Payments**
  - User action tracking
  - Stripe payment integration
  - Order management
  - Comprehensive analytics

## 🏗️ Architecture

### Backend (Firebase Functions)
```
functions/
├── handlers/           # Feature-specific logic
│   ├── marketplace.js
│   ├── bookExchange.js
│   ├── community.js
│   ├── businessX.js
│   └── adsX.js
├── services/          # Shared services
│   ├── analytics.js
│   ├── payments.js
│   └── storage.js
└── index.js          # Main entry point
```

### Frontend (React)
```
src/
├── components/        # Reusable components
├── pages/            # Page components
├── contexts/         # React contexts
├── config/           # Configuration
└── firebase.js       # Firebase setup
```

### AI Functions (Python)
```
pythonfunctions/
├── main.py           # AI processing functions
└── requirements.txt  # Python dependencies
```

## 🗄️ Database Schema

The application uses Firestore with these main collections:
- `users` - User profiles
- `listings` - Marketplace items
- `books` - Books for exchange
- `posts` - Community posts
- `businesses` - Student businesses
- `serviceRequests` - AdsX requests
- `analyticsEvents` - User tracking
- `orders` - Payment orders

See `FIRESTORE_SCHEMA.md` for detailed schema.

## 🔧 Configuration

### Required Environment Variables

**Frontend (.env)**
```env
REACT_APP_API_KEY=your_firebase_api_key
REACT_APP_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_PROJECT_ID=your_project_id
# ... other Firebase config
```

**Functions (.env)**
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_key
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FRONTEND_URL=http://localhost:3000
```

**Python (.env)**
```env
OPENAI_API_KEY=sk-your_openai_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account.json
```

## 🚀 Deployment

### 1. Firebase Setup
- Enable Authentication (Google provider)
- Create Firestore database
- Set up Storage
- Deploy security rules

### 2. Stripe Setup
- Create Stripe account
- Get API keys
- Configure webhooks

### 3. OpenAI Setup
- Create OpenAI account
- Generate API key

### 4. Deploy
```bash
# Deploy all services
firebase deploy

# Or deploy individually
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## 📚 Documentation

- [Complete Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Database Schema](FIRESTORE_SCHEMA.md)
- [API Documentation](API_DOCUMENTATION.md)

## 🔒 Security

- Firestore security rules implemented
- Authentication required for all operations
- User ownership validation
- Admin role restrictions
- Input validation and sanitization

## 📊 Analytics

- User action tracking
- Performance monitoring
- Error reporting
- Custom analytics events
- Firebase Analytics integration

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd functions && npm test

# Integration tests with emulators
firebase emulators:start
```

## 🛠️ Development

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start

# Start React development server
npm start

# Start functions in development mode
cd functions && npm run serve
```

### Code Standards
- ESLint configuration
- Prettier formatting
- TypeScript for new features
- Comprehensive testing
- Documentation requirements

## 📈 Performance

### Optimizations Implemented
- Function cold start optimization
- Database query optimization
- Image compression
- Code splitting
- Bundle optimization

## 🔮 Future Enhancements

- Real-time chat system
- Mobile app development
- Advanced ML recommendations
- Video call integration
- Enhanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

For questions and support:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Status**: ✅ Complete and Ready for Deployment

All features are implemented and functional. The application is ready for production deployment with proper configuration of Firebase, Stripe, and OpenAI services.