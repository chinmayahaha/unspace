/* src/App.js */
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// CONTEXT
import { AuthProvider } from './features/auth/context/AuthContext';

// LAYOUTS
import Layout from './components/layout/Layout';

// AUTH GUARD — prevents 401s by blocking unauthenticated page renders
import ProtectedRoute from './features/auth/components/ProtectedRoute';

// GLOBAL STYLES
import './styles/global.css';

// --- LAZY LOADED PAGES ---
const HomePage        = React.lazy(() => import('./pages/HomePage'));
const Dashboard       = React.lazy(() => import('./pages/Dashboard'));
const TermsPage       = React.lazy(() => import('./pages/TermsPage'));
const ContactPage     = React.lazy(() => import('./pages/ContactPage'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));

// Auth
const SignIn          = React.lazy(() => import('./features/auth/pages/SignIn'));
const SignUp          = React.lazy(() => import('./features/auth/pages/SignUp'));
const AdminPage       = React.lazy(() => import('./pages/AdminPage'));

// Marketplace
const MarketplacePage    = React.lazy(() => import('./features/marketplace/pages/MarketplacePage'));
const CreateListingPage  = React.lazy(() => import('./features/marketplace/pages/CreateListingPage'));
const ListingDetailPage  = React.lazy(() => import('./features/marketplace/pages/ListingDetailPage'));

// Books
const BookExchangePage = React.lazy(() => import('./features/books/pages/BookExchangePage'));
const AddBookPage      = React.lazy(() => import('./features/books/pages/AddBookPage'));

// Community
const CommunityPage  = React.lazy(() => import('./features/community/pages/CommunityPage'));
const CreatePostPage = React.lazy(() => import('./features/community/pages/CreatePostPage'));
const PostDetailPage = React.lazy(() => import('./features/community/pages/PostDetailPage'));

// AdsX
const AdsXPage           = React.lazy(() => import('./features/ads/pages/AdsXPage'));
const SubmitRequestPage  = React.lazy(() => import('./features/ads/pages/SubmitRequestPage'));
const RequestDetailPage  = React.lazy(() => import('./features/ads/pages/RequestDetailPage'));

// BusinessX
const BusinessXPage        = React.lazy(() => import('./features/business/pages/BusinessXPage'));
const RegisterBusinessPage = React.lazy(() => import('./features/business/pages/RegisterBusinessPage'));
const BusinessDetailPage   = React.lazy(() => import('./features/business/pages/BusinessDetailPage'));

// Lost & Found
const LostAndFoundPage = React.lazy(() => import('./features/lostfound/pages/LostAndFoundPage'));
const PostItemPage = React.lazy(() => import('./features/lostfound/pages/PostItemPage'));
const ItemDetailPage = React.lazy(() => import('./features/lostfound/pages/ItemDetailPage'));

const Loading = () => (
  <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
    Loading Unspace...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>

            {/* =========================================================
                PUBLIC ROUTES — no auth required
            ========================================================= */}
            <Route path="/"        element={<HomePage />} />
            <Route path="/signin"  element={<SignIn />} />
            <Route path="/signup"  element={<SignUp />} />
            <Route path="/terms"   element={<Layout><TermsPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

            {/* Public browsing — anyone can view listings/books/businesses/ads */}
            <Route path="/marketplace"         element={<Layout><MarketplacePage /></Layout>} />
            <Route path="/listing/:listingId"  element={<Layout><ListingDetailPage /></Layout>} />
            <Route path="/book-exchange"       element={<Layout><BookExchangePage /></Layout>} />
            <Route path="/community"           element={<Layout><CommunityPage /></Layout>} />
            <Route path="/community/post/:postId" element={<Layout><PostDetailPage /></Layout>} />
            <Route path="/adsx"                element={<Layout><AdsXPage /></Layout>} />
            <Route path="/adsx/:requestId"     element={<Layout><RequestDetailPage /></Layout>} />
            <Route path="/businessx"           element={<Layout><BusinessXPage /></Layout>} />
            <Route path="/businessx/:businessId" element={<Layout><BusinessDetailPage /></Layout>} />
            <Route path="/lostfound" element={<Layout><LostAndFoundPage /></Layout>} />
            <Route path="/lostfound/:itemId" element={<Layout><ItemDetailPage /></Layout>} />

            {/* =========================================================
                PROTECTED ROUTES — must be signed in
                ProtectedRoute redirects to /signin if user is null,
                eliminating ALL 401 errors at the source
            ========================================================= */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>
            } />
            <Route path="/lostfound/post" element={
  <ProtectedRoute><Layout><PostItemPage /></Layout></ProtectedRoute>
} />
<Route path="/lostfound/:itemId" element={<Layout><ItemDetailPage /></Layout>} /> 
            
            <Route path="/marketplace/new" element={
              <ProtectedRoute><Layout><CreateListingPage /></Layout></ProtectedRoute>
            } />

            <Route path="/book-exchange/add" element={
              <ProtectedRoute><Layout><AddBookPage /></Layout></ProtectedRoute>
            } />

            <Route path="/community/new" element={
              <ProtectedRoute><Layout><CreatePostPage /></Layout></ProtectedRoute>
            } />

            <Route path="/adsx/submit" element={
              <ProtectedRoute><Layout><SubmitRequestPage /></Layout></ProtectedRoute>
            } />

            <Route path="/businessx/register" element={
              <ProtectedRoute><Layout><RegisterBusinessPage /></Layout></ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}><Layout><AdminPage /></Layout></ProtectedRoute>
            } />

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;