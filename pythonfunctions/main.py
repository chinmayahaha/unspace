"""
pythonfunctions/main.py

This module contains AI helper functions used by the backend:
- generate_listing_description(listing_id)
- moderate_content(content_id, content_type)

Invocation / Trigger mechanism:
- The Node.js backend writes documents to the Firestore collection `aiTasks` with fields
    such as `type` (e.g. 'generateListingDescription' or 'moderateContent'), `listingId` or
    `contentId`, and an initial `status: 'pending'`.
- This Python process can be deployed in one of two common ways:
    1) As a Cloud Function (Python) that listens to Firestore onCreate/onWrite events for
         `aiTasks/{taskId}` and processes the task when created.
    2) As a Cloud Run service or VM cron worker that periodically polls Firestore for
         tasks with `status == 'pending'` and processes them.

Notes:
- The current file implements a polling-style processor (`process_ai_tasks`) and
    standalone helpers (`generate_listing_description`, `moderate_content`) which are
    suitable for running as a cron/Cloud Run job or wired into a Firestore-triggered
    function with minimal adaptation.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import firestore as firestore_client
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    # Use default credentials (service account key should be set via environment variable)
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

# Initialize Firestore client
db = firestore_client.Client()

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

class AIProcessor:
    """Main class for processing AI tasks"""
    
    def __init__(self):
        self.db = db
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    def process_ai_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process AI task based on type"""
        task_type = task_data.get('type')
        task_id = task_data.get('id')
        
        logger.info(f"Processing AI task: {task_type} with ID: {task_id}")
        
        try:
            if task_type == 'generateListingDescription':
                return self.generate_listing_description(task_data)
            elif task_type == 'moderateContent':
                return self.moderate_content(task_data)
            else:
                logger.warning(f"Unknown task type: {task_type}")
                return {'status': 'error', 'message': f'Unknown task type: {task_type}'}
        except Exception as e:
            logger.error(f"Error processing task {task_id}: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def generate_listing_description(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI description for a marketplace listing"""
        listing_id = task_data.get('listingId')
        
        if not listing_id:
            return {'status': 'error', 'message': 'Listing ID is required'}
        
        try:
            # Get listing data from Firestore
            listing_ref = self.db.collection('listings').document(listing_id)
            listing_doc = listing_ref.get()
            
            if not listing_doc.exists:
                return {'status': 'error', 'message': 'Listing not found'}
            
            listing_data = listing_doc.to_dict()
            
            # Prepare prompt for OpenAI
            prompt = f"""
            Generate a compelling and detailed description for this marketplace listing:
            
            Title: {listing_data.get('title', '')}
            Category: {listing_data.get('category', '')}
            Condition: {listing_data.get('condition', '')}
            Price: ${listing_data.get('price', 0)}
            Current Description: {listing_data.get('description', '')}
            
            Please create a professional, engaging description that:
            1. Highlights the key features and benefits
            2. Mentions the condition and value
            3. Appeals to potential buyers
            4. Is appropriate for a university marketplace
            5. Is 2-3 sentences long
            
            Return only the description text, no additional formatting.
            """
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates compelling marketplace descriptions for university students."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            ai_description = response.choices[0].message.content.strip()
            
            # Update the listing with AI-generated description
            listing_ref.update({
                'aiDescription': ai_description,
                'aiGeneratedAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            })
            
            # Update task status
            task_ref = self.db.collection('aiTasks').document(task_data.get('id'))
            task_ref.update({
                'status': 'completed',
                'result': ai_description,
                'completedAt': datetime.utcnow()
            })
            
            logger.info(f"Generated AI description for listing {listing_id}")
            return {'status': 'success', 'description': ai_description}
            
        except Exception as e:
            logger.error(f"Error generating listing description: {str(e)}")
            # Update task status to failed
            task_ref = self.db.collection('aiTasks').document(task_data.get('id'))
            task_ref.update({
                'status': 'failed',
                'error': str(e),
                'failedAt': datetime.utcnow()
            })
            return {'status': 'error', 'message': str(e)}
    
    def moderate_content(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Moderate content for inappropriate material"""
        content_id = task_data.get('contentId')
        content_type = task_data.get('contentType')
        
        if not content_id or not content_type:
            return {'status': 'error', 'message': 'Content ID and type are required'}
        
        try:
            # Get content from Firestore
            collection_name = 'posts' if content_type == 'post' else 'comments'
            content_ref = self.db.collection(collection_name).document(content_id)
            content_doc = content_ref.get()
            
            if not content_doc.exists:
                return {'status': 'error', 'message': 'Content not found'}
            
            content_data = content_doc.to_dict()
            
            # Prepare content for moderation
            text_to_moderate = ""
            if content_type == 'post':
                text_to_moderate = f"{content_data.get('title', '')} {content_data.get('content', '')}"
            else:  # comment
                text_to_moderate = content_data.get('content', '')
            
            # Call OpenAI for content moderation
            moderation_prompt = f"""
            Analyze the following text for inappropriate content, hate speech, harassment, or violations of university community guidelines:
            
            Text: "{text_to_moderate}"
            
            Respond with a JSON object containing:
            - "appropriate": true/false
            - "reason": brief explanation if inappropriate
            - "severity": "low", "medium", or "high" if inappropriate
            - "suggestions": array of suggested improvements if needed
            
            Focus on: profanity, hate speech, harassment, discrimination, inappropriate sexual content, violence, spam, or academic dishonesty.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a content moderation assistant for a university community platform. Be strict but fair."},
                    {"role": "user", "content": moderation_prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            moderation_result = response.choices[0].message.content.strip()
            
            try:
                moderation_data = json.loads(moderation_result)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                moderation_data = {
                    "appropriate": True,
                    "reason": "Unable to parse moderation result",
                    "severity": "low",
                    "suggestions": []
                }
            
            # Update content with moderation results
            update_data = {
                'moderated': True,
                'moderationResult': moderation_data,
                'moderatedAt': datetime.utcnow()
            }
            
            # If content is inappropriate, mark it for review
            if not moderation_data.get('appropriate', True):
                update_data['status'] = 'under_review'
                update_data['moderationFlag'] = True
            
            content_ref.update(update_data)
            
            # Update task status
            task_ref = self.db.collection('aiTasks').document(task_data.get('id'))
            task_ref.update({
                'status': 'completed',
                'result': moderation_data,
                'completedAt': datetime.utcnow()
            })
            
            logger.info(f"Moderated {content_type} {content_id}: {moderation_data.get('appropriate', True)}")
            return {'status': 'success', 'moderation': moderation_data}
            
        except Exception as e:
            logger.error(f"Error moderating content: {str(e)}")
            # Update task status to failed
            task_ref = self.db.collection('aiTasks').document(task_data.get('id'))
            task_ref.update({
                'status': 'failed',
                'error': str(e),
                'failedAt': datetime.utcnow()
            })
            return {'status': 'error', 'message': str(e)}

def process_ai_tasks():
    """Main function to process pending AI tasks"""
    logger.info("Starting AI task processor...")
    
    processor = AIProcessor()
    
    try:
        # Query for pending AI tasks
        tasks_ref = db.collection('aiTasks')
        pending_tasks = tasks_ref.where('status', '==', 'pending').limit(10).get()
        
        if not pending_tasks:
            logger.info("No pending AI tasks found")
            return
        
        logger.info(f"Found {len(pending_tasks)} pending tasks")
        
        for task_doc in pending_tasks:
            task_data = task_doc.to_dict()
            task_data['id'] = task_doc.id
            
            logger.info(f"Processing task: {task_data.get('type')} - {task_doc.id}")
            
            # Mark task as processing
            task_doc.reference.update({'status': 'processing', 'startedAt': datetime.utcnow()})
            
            # Process the task
            result = processor.process_ai_task(task_data)
            
            logger.info(f"Task {task_doc.id} completed with status: {result.get('status')}")
            
    except Exception as e:
        logger.error(f"Error in AI task processor: {str(e)}")

def generate_listing_description(listing_id: str) -> Dict[str, Any]:
    """Standalone function to generate listing description"""
    processor = AIProcessor()
    task_data = {
        'type': 'generateListingDescription',
        'listingId': listing_id,
        'id': f'temp_{datetime.utcnow().timestamp()}'
    }
    return processor.process_ai_task(task_data)

def moderate_content(content_id: str, content_type: str) -> Dict[str, Any]:
    """Standalone function to moderate content"""
    processor = AIProcessor()
    task_data = {
        'type': 'moderateContent',
        'contentId': content_id,
        'contentType': content_type,
        'id': f'temp_{datetime.utcnow().timestamp()}'
    }
    return processor.process_ai_task(task_data)


def firestore_ai_task_listener(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Firestore onCreate trigger wrapper for aiTasks documents.

    This function is intended to be used as the Python Cloud Function entry point
    (e.g. deployed with an event trigger for document creation on
    `projects/{project_id}/databases/(default)/documents/aiTasks/{taskId}`).

    The event may contain a resource name that includes the document path; to
    be robust we resolve the full document from Firestore and then invoke the
    AIProcessor to handle the task.

    Example deployment (gcloud):
      gcloud functions deploy firestore_ai_task_listener \
        --runtime=python311 --trigger-event providers/cloud.firestore/eventTypes/document.create \
        --trigger-resource "projects/PROJECT_ID/databases/(default)/documents/aiTasks/{taskId}"
    """
    try:
        # context.resource should contain the full resource name
        resource = getattr(context, "resource", None) or (context and context.resource)
        if not resource:
            # Fallback: event may contain value.name with full document path
            doc_full_name = event.get("value", {}).get("name")
        else:
            # resource looks like: "projects/_/databases/(default)/documents/aiTasks/{taskId}"
            doc_full_name = resource.split("/documents/", 1)[1] if "/documents/" in resource else None

        if not doc_full_name:
            # As a final fallback, try to read directly from event
            doc_full_name = event.get("value", {}).get("name")

        if not doc_full_name:
            logger.error("Could not determine Firestore document path from event/context")
            return {"status": "error", "message": "missing document path"}

        # Convert full resource path to a Firestore document path usable by client
        # If doc_full_name already contains the 'documents/' prefix removed, use as-is
        # Otherwise, when it contains the full name, extract the path after '/documents/'
        if doc_full_name.startswith("projects/") and "/documents/" in doc_full_name:
            doc_path = doc_full_name.split("/documents/", 1)[1]
        else:
            doc_path = doc_full_name

        doc_ref = db.document(doc_path)
        snap = doc_ref.get()
        if not snap.exists:
            logger.warning(f"aiTasks document not found: {doc_path}")
            return {"status": "error", "message": "task not found"}

        task = snap.to_dict()
        task["id"] = snap.id

        # Only process pending tasks
        if task.get("status") != "pending":
            logger.info(f"Skipping task {snap.id} with status {task.get('status')}")
            return {"status": "skipped", "taskId": snap.id, "currentStatus": task.get("status")}

        processor = AIProcessor()

        # Mark task as processing
        doc_ref.update({"status": "processing", "startedAt": datetime.utcnow()})

        result = processor.process_ai_task(task)

        logger.info(f"Processed AI task {snap.id} -> {result.get('status')}")
        return result
    except Exception as exc:
        logger.exception("Error in Firestore AI task listener: %s", exc)
        return {"status": "error", "message": str(exc)}

if __name__ == "__main__":
    # Run the AI task processor
    process_ai_tasks()