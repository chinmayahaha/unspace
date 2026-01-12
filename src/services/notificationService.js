/* src/services/notificationService.js */
import { db } from '../firebase'; // Ensure this points to your firebase.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Enterprise Pattern: Service Layer
 * Handles the logic of notifying a seller without cluttering the UI component.
 */
export const sendContactNotification = async (listingId, sellerId, buyerId, listingTitle) => {
  if (!buyerId) throw new Error("You must be logged in to contact a seller.");
  
  try {
    const notificationRef = collection(db, 'notifications');
    
    await addDoc(notificationRef, {
      type: 'buy_request',
      toUserId: sellerId,      // The person receiving the notification
      fromUserId: buyerId,     // The person interested
      listingId: listingId,
      title: listingTitle,
      message: `Hi, I'm interested in buying your ${listingTitle}.`,
      read: false,
      createdAt: serverTimestamp(), // Server-side time is safer than client time
    });

    return { success: true };
  } catch (error) {
    console.error("Notification Error:", error);
    throw error;
  }
};