# Plan: Resilient Upload — Summary Always Succeeds, Chat Gated by Embeddings

## Goal
Ensure the document upload endpoint **always returns the summary** to the user, even if embedding generation fails. If embeddings fail, **block chat** for that document.

## Files to Change

### 1. `src/schemas.py`
- Add `chat_available: bool = True` field to `DocumentUploadResponse`

### 2. `start_server.py` — Upload Endpoint (`/api/documents/upload`)
- Wrap the embedding generation block (lines ~115-117) in its own `try/except`
- Set `chat_available = True` if embeddings succeed, `False` if they fail
- Log a warning on failure instead of crashing the entire request
- Include `chat_available` in the response payload

### 3. `start_server.py` — Chat Endpoint (`/api/documents/{doc_id}/chat`)
- Optionally: save `chat_available` flag to Supabase with the document so the chat endpoint can reject requests if embeddings were never generated

## Expected Behavior

| Scenario | Summary | Chat |
|---|---|---|
| Both succeed | ✅ Returned | ✅ Enabled |
| Embeddings fail | ✅ Returned | ❌ Blocked |
| Summary fails | ❌ 500 Error | ❌ N/A |

## Status
⏳ **Waiting for user approval to implement**
