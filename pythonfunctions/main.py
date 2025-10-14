# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_functions import auth_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from firebase_admin import firestore

# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(max_instances=10)

initialize_app()
@https_fn.on_call()
def contact_seller(req: https_fn.CallableRequest):
    """
    A callable function to let a user express interest in a listing.
    """
    # Check if the user making the call is authenticated
    if req.auth is None:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="You must be logged in to perform this action."
        )

    # Get the data sent from the React app
    listing_id = req.data.get("listingId")
    message = req.data.get("message")
    buyer_uid = req.auth.uid
    
    # In a real app, you would add logic here to create a chat document
    # or send an email/notification to the seller.
    
    print(f"SUCCESS: User {buyer_uid} sent message '{message}' for listing {listing_id}")

    # Return a result to the React app
    return {"status": "success", "message": "Your message has been sent!"}
@auth_fn.on_user_created()
def on_user_create(event: auth_fn.AuthUserRecord) -> None:
    """
    Triggered when a new user signs up; creates a user profile in Firestore.
    """
    print(f"New user created: {event.data.email}, UID: {event.data.uid}")

    # Get user information from the event
    user_uid = event.data.uid
    email = event.data.email
    display_name = event.data.display_name or email.split('@')[0]
    photo_url = event.data.photo_url or None
    
    # Get a reference to the Firestore database
    db = firestore.client()
    
    # Create a new document in the 'users' collection with the user's UID
    user_doc_ref = db.collection("users").document(user_uid)
    user_doc_ref.set({
        "name": display_name,
        "email": email,
        "photoURL": photo_url,
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    
    print(f"Firestore profile created for UID: {user_uid}")
    
    return