# DocLens — Intelligent Document Summary Assistant

> Upload a document. Understand it instantly. Ask questions about it.

DocLens is a production-ready Document Summary Assistant that leverages Google Gemini AI, advanced RAG (Retrieval-Augmented Generation), and OCR to extract, summarize, and answer questions about uploaded documents — all through a clean, modern interface.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Search-764ABC)
![Tesseract](https://img.shields.io/badge/Tesseract-OCR-green)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [API Endpoints](#api-endpoints)
- [Document Processing Pipeline](#document-processing-pipeline)
- [Supported Formats](#supported-formats)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Approach](#approach)

---

## Features

### Core

- **PDF & Image Upload** — Drag-and-drop or file picker with real-time upload progress
- **OCR Processing** — Automatic Tesseract OCR for scanned documents and images
- **Smart Summaries** — AI-generated summaries in three lengths:
  - **Short** — Concise overview of the most important information
  - **Medium** — Balanced summary covering major sections and conclusions
  - **Long** — Detailed summary preserving context, explanations, and relationships
- **Key Points** — Bullet-point extraction of the most important information
- **Main Ideas** — Higher-level concepts and themes from the document
- **Improvement Suggestions** — AI-identified areas for further review or clarification
- **Document Q&A** — Ask follow-up questions about any uploaded document using RAG

### Authentication & Persistence

- **Firebase Authentication** — Email/password registration and login
- **Supabase Database** — Persistent storage for documents, summaries, and chat history
- **User Isolation** — Each user's data is fully scoped and protected
- **Session Persistence** — Return later and access all previous documents and conversations

### Multi-Format Document Support

- **PDF** — Text extraction via PyMuPDF with OCR fallback for scanned pages
- **Images** — PNG, JPG, JPEG, TIFF, BMP with Tesseract OCR
- **DOCX** — Microsoft Word via python-docx
- **PPTX / PPT** — PowerPoint with embedded image OCR
- **XLSX / XLS** — Excel via pandas/openpyxl
- **Email / HTML** — Structured email content extraction
- **ZIP Archives** — Safe extraction with ZIP bomb protection

### UX

- **Responsive Design** — Desktop, tablet, and mobile layouts
- **Loading States** — Step-by-step processing feedback (Extracting → OCR → Summarizing → Complete)
- **Error Handling** — User-friendly messages for unsupported files, API failures, and network issues
- **Chat History** — Grouped by date with quick navigation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  Login/Register → Dashboard → Upload → Document Workspace → Q&A │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API + Firebase Auth Token
┌──────────────────────────────▼──────────────────────────────────┐
│                       BACKEND (FastAPI)                          │
│                                                                  │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────┐  │
│  │ Firebase  │   │   Document   │   │     Gemini Service      │  │
│  │   Auth    │   │  Extractor   │   │  (Summary / Q&A / KP)   │  │
│  │ Verify    │   │  + OCR       │   └────────────┬────────────┘  │
│  └──────────┘   └──────┬───────┘                 │               │
│                         │                         │               │
│                  ┌──────▼───────┐          ┌──────▼────────┐     │
│                  │   Chunking   │          │  Fallback LLM │     │
│                  │  (512w/50ov) │          │  (HF / Rules) │     │
│                  └──────┬───────┘          └───────────────┘     │
│                         │                                        │
│                  ┌──────▼───────┐   ┌──────────────────────┐    │
│                  │  Embeddings  │   │     Supabase          │    │
│                  │ (MiniLM-L3)  │   │  (Documents, Chats,   │    │
│                  └──────┬───────┘   │   History, Users)     │    │
│                         │           └──────────────────────┘    │
│                  ┌──────▼───────┐                               │
│                  │    FAISS     │                                │
│                  │ Vector Store │                                │
│                  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### Processing Flow

```
User Login (Firebase)
    ↓
Upload Document
    ↓
Backend Auth Verification
    ↓
Input Validation + Security Checks
    ↓
File Type Detection
    ↓
Text Extraction (PyMuPDF / python-docx / pandas / etc.)
    ↓
OCR (Tesseract) — if scanned/image document
    ↓
Text Cleaning & Normalization
    ↓
Smart Chunking (512 words, 50-word overlap)
    ↓
Embedding Generation (SentenceTransformer MiniLM-L3)
    ↓
FAISS Vector Index
    ↓
Document Metadata → Supabase
    ↓
Summary Generation (Gemini) → Short / Medium / Long
    ↓
Key Points + Main Ideas + Improvement Suggestions
    ↓
Results → Supabase + Frontend
    ↓
User Can Ask Questions (RAG → FAISS → Gemini)
    ↓
Chat Stored in Supabase
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TailwindCSS 3.4, TypeScript |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **AI / LLM** | Google Gemini API (primary), HuggingFace Transformers (fallback) |
| **Document Processing** | PyMuPDF (fitz), python-docx, python-pptx, pandas, openpyxl |
| **OCR** | Tesseract OCR via pytesseract |
| **Vector Search** | FAISS (IndexFlatIP), SentenceTransformer (paraphrase-MiniLM-L3-v2) |
| **Authentication** | Firebase Authentication (email/password) |
| **Database** | Supabase (PostgreSQL) |
| **Embeddings** | SentenceTransformer with tiktoken tokenization |

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Tesseract OCR** — [Install guide](https://github.com/tesseract-ocr/tesseract)
  - Windows: Download installer from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
  - macOS: `brew install tesseract`
  - Linux: `sudo apt install tesseract-ocr`
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)
- **Firebase Project** — [Create one](https://console.firebase.google.com/)
- **Supabase Project** — [Create one](https://supabase.com/dashboard)

### Installation

```bash
# Clone the repository
git clone https://github.com/shivamchavan12/DocLens.git
cd DocLens

# Backend setup
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
cd ..
```

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# Firebase (Admin SDK - backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
LOG_LEVEL=INFO
MAX_WORKERS=4
TESSERACT_CMD=C:/Program Files/Tesseract-OCR/tesseract.exe
```

Create `frontend/.env.local` for the frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **Never commit `.env` or `.env.local` files.** Use `.env.example` as reference.

---

## Running Locally

### Backend

```bash
# From project root (with venv activated)
python start_server.py
# Server starts at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm run dev
# App starts at http://localhost:3000
```

### Verify

- Backend health: `GET http://localhost:8000/health`
- Frontend: Open `http://localhost:3000` in your browser

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload and process a document |
| `GET` | `/api/documents` | List user's documents |
| `GET` | `/api/documents/{id}` | Get document detail + summary |
| `POST` | `/api/documents/{id}/summary` | Regenerate summary (different length) |
| `POST` | `/api/documents/{id}/chat` | Ask a question about the document |
| `GET` | `/api/documents/{id}/chat` | Get chat history for document |
| `GET` | `/api/history` | Get user's full history |
| `DELETE` | `/api/documents/{id}` | Delete a document |
| `GET` | `/health` | Health check |

All `/api/*` endpoints require a Firebase authentication token in the `Authorization: Bearer <token>` header.

---

## Document Processing Pipeline

### Text Extraction

| Format | Extractor | OCR Fallback |
|---|---|---|
| PDF | PyMuPDF (fitz) | ✅ Auto-detects scanned pages |
| Images | — | ✅ Tesseract OCR |
| DOCX | python-docx | — |
| PPTX | python-pptx | ✅ Embedded images |
| XLSX | pandas + openpyxl | — |
| PPT (legacy) | OLE parsing | ✅ Embedded images |
| Email | email + BeautifulSoup | — |

### OCR Detection

For PDFs, the system automatically determines if OCR is needed:
1. Extract text using PyMuPDF
2. If extracted text < 100 characters → page is likely scanned
3. Convert pages to images → run Tesseract OCR
4. Combine OCR text with any extracted text

### Chunking Strategy

- **Chunk size:** ~512 words
- **Overlap:** ~50 words
- **Method:** Sentence-boundary splitting with overlap for context continuity

### RAG Pipeline (for Q&A)

1. Query → SentenceTransformer embedding
2. FAISS similarity search (top-k=15 chunks)
3. Keyword-based score enhancement
4. Intent analysis (content type, question tone)
5. Context assembly (max 3000 words)
6. Gemini generates contextual answer

---

## Supported Formats

| Format | Extensions | Primary / Enhanced |
|---|---|---|
| PDF | `.pdf` | ✅ Primary |
| Images | `.png`, `.jpg`, `.jpeg`, `.tiff`, `.bmp` | ✅ Primary |
| Word | `.docx`, `.doc` | Enhanced |
| PowerPoint | `.pptx`, `.ppt` | Enhanced |
| Excel | `.xlsx`, `.xls` | Enhanced |
| Email | `.eml` | Enhanced |
| HTML | `.html`, `.htm` | Enhanced |
| ZIP | `.zip` | Enhanced (with safety checks) |

---

## Project Structure

```
DocLens/
├── start_server.py              # FastAPI application entry point
├── config.py                    # Environment-based configuration
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
│
├── src/                         # Backend source modules
│   ├── gemini_llm_engine.py     # Google Gemini API service
│   ├── summary_service.py       # Summary orchestration service
│   ├── document_text_extractor.py  # Multi-format document extraction + OCR
│   ├── embedding_generator.py   # SentenceTransformer embeddings
│   ├── faiss_vector_store.py    # FAISS vector store (save/load/search)
│   ├── query_resolver.py        # RAG query pipeline
│   ├── answer_generation_engine.py # LLM answer generation with fallbacks
│   ├── firebase_service.py      # Firebase auth verification
│   ├── supabase_service.py      # Supabase database operations
│   ├── schemas.py               # Pydantic request/response models
│   ├── input_validator.py       # File & URL validation, security
│   ├── text_cleaner_utils.py    # Text normalization utilities
│   ├── api_request_logger.py    # Audit logging
│   ├── intelligent_agent.py     # Dynamic agent for complex documents
│   ├── llm_interaction_service.py  # LLM interaction abstraction
│   ├── open_source_llm_engine.py   # HuggingFace fallback models
│   └── rule_based_answer_engine.py # Rule-based fallback engine
│
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Dashboard (upload + recent docs)
│   │   │   ├── layout.tsx       # Root layout with auth provider
│   │   │   ├── login/           # Login page
│   │   │   ├── register/        # Registration page
│   │   │   ├── documents/[id]/  # Document workspace
│   │   │   └── components/      # Shared UI components
│   │   ├── contexts/            # React contexts (auth)
│   │   └── lib/                 # Firebase, Supabase, API clients
│   ├── package.json
│   └── tailwind.config.ts
│
├── supabase/
│   └── schema.sql               # Database schema & RLS policies
│
└── tests/                       # Test suite
    ├── test_document_extraction.py
    ├── test_summary_service.py
    ├── test_gemini_service.py
    ├── test_auth.py
    └── test_api.py
```

---

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_summary_service.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

### Test Coverage

- Document extraction (PDF, Image, DOCX)
- OCR processing
- Chunking validation
- Summary generation (Short/Medium/Long)
- Key points & main ideas extraction
- Gemini API failure handling
- Firebase auth verification
- User data isolation
- API endpoint integration
- Health check

---

## Deployment

### Backend

The FastAPI backend can be deployed to any Python-compatible platform:

```bash
# Production with Uvicorn
uvicorn start_server:app --host 0.0.0.0 --port 8000 --workers 4
```

Compatible with: Railway, Render, AWS EC2, Google Cloud Run, Azure App Service

### Frontend

```bash
cd frontend
npm run build
npm start
```

Compatible with: Vercel (recommended for Next.js), Netlify, AWS Amplify

---

## Approach

DocLens was built by evolving an existing sophisticated document-processing and RAG pipeline into a user-facing Document Summary Assistant. Rather than rebuilding from scratch, the strategy was to preserve the battle-tested extraction, chunking, embedding, and FAISS retrieval layers while adding a Gemini-powered summarization service on top. The primary LLM was migrated from Mistral to Google Gemini with structured JSON output for summaries, key points, and main ideas. Firebase Authentication provides secure user identity, while Supabase handles persistent storage with row-level security ensuring complete user isolation. The frontend was redesigned around a document-first workflow: upload → understand → ask — positioning the summary as the primary feature and Q&A as secondary. OCR is automatically triggered for scanned PDFs and images using Tesseract, with intelligent detection of pages that lack extractable text. The three-tier fallback chain (Gemini → HuggingFace → Rule-based) ensures the system remains functional even during API outages. The architecture prioritizes working functionality and clean UX over unnecessary complexity.

*(197 words)*

---

## License

This project was created as part of a technical assessment.

---

<p align="center">
  Built using FastAPI, Next.js, Gemini AI, and FAISS
</p>