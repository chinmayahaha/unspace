/* src/App.js */
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// CONTEXT (Critical: Prevents "White Screen" crashes on Auth pages)
import { AuthProvider } from './features/auth/context/AuthContext';

// LAYOUTS
import Layout from './components/layout/Layout'; 

// GLOBAL STYLES

import './styles/global.css';

// --- LAZY LOADED PAGES ---
const HomePage = React.lazy(() => import('./pages/HomePage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TermsPage = React.lazy(() => import('./pages/TermsPage')); 


// Uncomment when we build it
const ContactPage = React.lazy(() => import('./pages/ContactPage'));

// Auth
const SignIn = React.lazy(() => import('./features/auth/pages/SignIn'));
const SignUp = React.lazy(() => import('./features/auth/pages/SignUp'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

// Marketplace
const MarketplacePage = React.lazy(() => import('./features/marketplace/pages/MarketplacePage'));
const CreateListingPage = React.lazy(() => import('./features/marketplace/pages/CreateListingPage'));
const ListingDetailPage = React.lazy(() => import('./features/marketplace/pages/ListingDetailPage'));

// Books
const BookExchangePage = React.lazy(() => import('./features/books/pages/BookExchangePage'));
const AddBookPage = React.lazy(() => import('./features/books/pages/AddBookPage'));

// Community
const CommunityPage = React.lazy(() => import('./features/community/pages/CommunityPage'));
const CreatePostPage = React.lazy(() => import('./features/community/pages/CreatePostPage'));
const PostDetailPage = React.lazy(() => import('./features/community/pages/PostDetailPage'));

// Ads / Services (AdsX)
const AdsXPage = React.lazy(() => import('./features/ads/pages/AdsXPage'));
const SubmitRequestPage = React.lazy(() => import('./features/ads/pages/SubmitRequestPage'));
const RequestDetailPage = React.lazy(() => import('./features/ads/pages/RequestDetailPage'));

// Business (BusinessX)
const BusinessXPage = React.lazy(() => import('./features/business/pages/BusinessXPage'));
const RegisterBusinessPage = React.lazy(() => import('./features/business/pages/RegisterBusinessPage'));
const BusinessDetailPage = React.lazy(() => import('./features/business/pages/BusinessDetailPage'));

// Loading Screen
const Loading = () => <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading Unspace...</div>;

function App() {
  return (
    // We wrap everything in AuthProvider so 'useAuth' works in your other files
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* ========================================================= */}
            {/* 1. PUBLIC ROUTES (No Sidebar, Full Screen)                */}
            {/* ========================================================= */}
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
            
             {/* Admin Route - In real app, wrap this with <AdminRoute> protection */}
              <Route path="/admin" element={<Layout><AdminPage /></Layout>} />

            {/* ========================================================= */}
            {/* 2. APP ROUTES (Wrapped in Sidebar Layout)                 */}
            {/* ========================================================= */}
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />

            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

            {/* Marketplace Routes */}
            <Route path="/marketplace" element={<Layout><MarketplacePage /></Layout>} />
            <Route path="/marketplace/new" element={<Layout><CreateListingPage /></Layout>} />
            <Route path="/listing/:listingId" element={<Layout><ListingDetailPage /></Layout>} />

            {/* Book Exchange Routes */}
            <Route path="/book-exchange" element={<Layout><BookExchangePage /></Layout>} />
            <Route path="/book-exchange/add" element={<Layout><AddBookPage /></Layout>} />

            {/* Community Routes */}
            <Route path="/community" element={<Layout><CommunityPage /></Layout>} />
            <Route path="/community/new" element={<Layout><CreatePostPage /></Layout>} />
            <Route path="/community/post/:postId" element={<Layout><PostDetailPage /></Layout>} />

            {/* AdsX (Service Requests) Routes */}
            <Route path="/adsx" element={<Layout><AdsXPage /></Layout>} />
            <Route path="/adsx/submit" element={<Layout><SubmitRequestPage /></Layout>} />
            <Route path="/adsx/:requestId" element={<Layout><RequestDetailPage /></Layout>} />

            {/* BusinessX Routes */}
            <Route path="/businessx" element={<Layout><BusinessXPage /></Layout>} />
            <Route path="/businessx/register" element={<Layout><RegisterBusinessPage /></Layout>} />
            <Route path="/businessx/:businessId" element={<Layout><BusinessDetailPage /></Layout>} />

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;