import logging
import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException
from config import Config

class FirebaseService:
    def __init__(self):
        self.app = None
        self._initialize()
        
    def _initialize(self):
        if not Config.FIREBASE_PROJECT_ID:
            logging.warning("Firebase config missing. Firebase auth will be bypassed in dev mode if fallback used.")
            return

        try:
            # Reconstruct private key properly handling newlines
            private_key = Config.FIREBASE_PRIVATE_KEY
            if private_key:
                private_key = private_key.replace('\\n', '\n')

            cred_dict = {
                "type": "service_account",
                "project_id": Config.FIREBASE_PROJECT_ID,
                "private_key_id": "dummy",
                "private_key": private_key,
                "client_email": Config.FIREBASE_CLIENT_EMAIL,
                "client_id": "dummy",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{Config.FIREBASE_CLIENT_EMAIL}"
            }
            
            # Check if already initialized
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_dict)
                self.app = firebase_admin.initialize_app(cred)
                logging.info("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            logging.error(f"Failed to initialize Firebase Admin SDK: {e}")

    def verify_token(self, token: str) -> dict:
        if not self.app:
            # Dev mode bypass if not configured
            logging.warning("Firebase not configured. Bypassing auth check (returns dummy user).")
            return {"uid": "dev-user-123", "email": "dev@doclens.com"}
            
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            logging.error(f"Firebase token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Invalid authentication token")

def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = auth_header.split(" ")[1]
    
    # In a real app this would be initialized once globally
    # For simplicity here we just use it directly
    fb_service = FirebaseService()
    user_data = fb_service.verify_token(token)
    return user_data
