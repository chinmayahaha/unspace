// src/pages/ListingDetailPage.js

import React from 'react';
import { useParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from "firebase/functions";
// Note: In a real app, you would use a library like 'react-router-dom'
// to get the listing ID from the URL. For example:
// import { useParams } from 'react-router-dom';

const ListingDetailPage = () => {
  // Get listingId from the URL path, e.g. /listing/:listingId
  const { listingId } = useParams();

  // Basic guard if no listingId provided in the URL
  if (!listingId) {
    return (
      <div>
        <h1>Listing Not Found</h1>
        <p>No listing ID provided in the URL.</p>
      </div>
    );
  }

  const handleContactSeller = async () => {
    console.log(`Attempting to contact seller for listing: ${listingId}`);

    // 1. Get a reference to the Cloud Functions service initialized in your firebase.js
    const functions = getFunctions();

    // 2. Get a reference to your specific callable function by its exact name
    const contactSeller = httpsCallable(functions, 'contactSeller');

    try {
      // 3. Call the function and pass it the data it needs (listingId, message, etc.)
      const result = await contactSeller({ 
        listingId: listingId, 
        message: "I am interested in this textbook!" 
      });
      
      // 4. Handle the successful response returned from your Cloud Function
      console.log("Function response:", result.data);
      alert(`Success! Server says: ${result.data.message}`);

    } catch (error) {
      // 5. Handle any errors that occur (e.g., user not logged in)
      console.error("Error calling Firebase function:", error);
      // firebase functions errors may have a .message or .code + .details
      const userMessage = error?.message || error?.code || 'Unknown error';
      alert(`Error: ${userMessage}`);
    }
  };

  return (
    <div>
      <h1>Listing Details Page</h1>
      <p>This is where you would show the title, price, and description for the item.</p>
      
      {/* This is the button that triggers our function call */}
      <button onClick={handleContactSeller}>
        Contact Seller
      </button>
    </div>
  );
};

export default ListingDetailPage;