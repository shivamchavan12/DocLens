import logging
import uuid
from typing import Dict, Any, List, Optional
from supabase import create_client, Client
from config import Config

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self._initialize()

    def _initialize(self):
        if not Config.SUPABASE_URL or not Config.SUPABASE_SERVICE_ROLE_KEY:
            logging.warning("Supabase URL or Key not found. Database operations will use in-memory mock.")
            self.client = None
            self.mock_db = {"documents": {}, "conversations": {}, "messages": {}}
            return
            
        try:
            self.client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
            logging.info("Supabase client initialized successfully.")
        except Exception as e:
            logging.error(f"Failed to initialize Supabase client: {e}")
            self.client = None
            self.mock_db = {"documents": {}, "conversations": {}, "messages": {}}

    def save_document(self, user_id: str, doc_data: Dict[str, Any]) -> str:
        doc_id = str(uuid.uuid4())
        
        record = {
            "id": doc_id,
            "firebase_user_id": user_id,
            "filename": doc_data.get("filename", "unknown"),
            "original_file_type": doc_data.get("file_type", "unknown"),
            "processing_status": "completed",
            "summary": doc_data.get("summary_data", {}).get("summary", ""),
            "summary_length": doc_data.get("summary_data", {}).get("summary_length", ""),
            "key_points": doc_data.get("summary_data", {}).get("key_points", []),
            "main_ideas": doc_data.get("summary_data", {}).get("main_ideas", []),
            "improvement_suggestions": doc_data.get("summary_data", {}).get("improvement_suggestions", [])
        }
        
        if self.client:
            self.client.table("documents").insert(record).execute()
        else:
            self.mock_db["documents"][doc_id] = record
            
        return doc_id

    def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        if self.client:
            response = self.client.table("documents").select("*").eq("firebase_user_id", user_id).order("created_at", desc=True).execute()
            return response.data
        else:
            return [doc for doc in self.mock_db["documents"].values() if doc["firebase_user_id"] == user_id]

    def get_document(self, user_id: str, doc_id: str) -> Optional[Dict[str, Any]]:
        if self.client:
            response = self.client.table("documents").select("*").eq("id", doc_id).eq("firebase_user_id", user_id).execute()
            return response.data[0] if response.data else None
        else:
            doc = self.mock_db["documents"].get(doc_id)
            if doc and doc["firebase_user_id"] == user_id:
                return doc
            return None

    def update_document_summary(self, user_id: str, doc_id: str, summary_data: Dict[str, Any]):
        updates = {
            "summary": summary_data.get("summary", ""),
            "summary_length": summary_data.get("summary_length", ""),
            "key_points": summary_data.get("key_points", []),
            "main_ideas": summary_data.get("main_ideas", []),
            "improvement_suggestions": summary_data.get("improvement_suggestions", [])
        }
        
        if self.client:
            self.client.table("documents").update(updates).eq("id", doc_id).eq("firebase_user_id", user_id).execute()
        else:
            if doc_id in self.mock_db["documents"] and self.mock_db["documents"][doc_id]["firebase_user_id"] == user_id:
                self.mock_db["documents"][doc_id].update(updates)

    def delete_document(self, user_id: str, doc_id: str) -> bool:
        if self.client:
            self.client.table("documents").delete().eq("id", doc_id).eq("firebase_user_id", user_id).execute()
            return True
        else:
            if doc_id in self.mock_db["documents"] and self.mock_db["documents"][doc_id]["firebase_user_id"] == user_id:
                del self.mock_db["documents"][doc_id]
                return True
            return False

    def save_chat_message(self, user_id: str, doc_id: str, role: str, content: str):
        # Very simplified for this assessment - ideally we link to a conversation table
        msg_id = str(uuid.uuid4())
        record = {
            "id": msg_id,
            "document_id": doc_id,
            "firebase_user_id": user_id,
            "role": role,
            "content": content
        }
        
        if self.client:
            self.client.table("messages").insert(record).execute()
        else:
            self.mock_db["messages"][msg_id] = record

    def get_chat_history(self, user_id: str, doc_id: str) -> List[Dict[str, Any]]:
        if self.client:
            response = self.client.table("messages").select("*").eq("document_id", doc_id).eq("firebase_user_id", user_id).order("created_at").execute()
            return response.data
        else:
            msgs = [msg for msg in self.mock_db["messages"].values() if msg["document_id"] == doc_id and msg["firebase_user_id"] == user_id]
            return msgs
