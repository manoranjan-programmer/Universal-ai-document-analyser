# 🧠 Universal AI Document Analyzer

> An AI-powered system for document understanding, semantic retrieval, and question answering using OCR, Sentence Transformers, FAISS, and Retrieval-Augmented Generation (RAG).

---

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Objectives](#objectives)
3. [Existing System](#existing-system)
4. [Proposed System](#proposed-system)
5. [System Architecture](#system-architecture)
6. [Technology Stack](#technology-stack)
7. [Dataset](#dataset)
8. [Preprocessing](#preprocessing)
9. [OCR](#ocr)
10. [Text Chunking](#text-chunking)
11. [Pretrained Transformer](#pretrained-transformer)
12. [Embeddings](#embeddings)
13. [FAISS Vector Search](#faiss-vector-search)
14. [Semantic Search](#semantic-search)
15. [RAG Pipeline](#rag-pipeline)
16. [LLM](#llm)
17. [System Workflow](#system-workflow)
18. [Project Structure](#project-structure)
19. [Installation](#installation)
20. [Kaggle Training / Experimentation](#kaggle-training--experimentation)
21. [Artifact Export](#artifact-export)
22. [Backend Setup](#backend-setup)
23. [Frontend Setup](#frontend-setup)
24. [Usage](#usage)
25. [API Reference](#api-reference)
26. [Future Enhancements](#future-enhancements)

---

## Problem Statement

Traditional document search systems rely on exact keyword matching and cannot understand the semantic meaning of text. When dealing with diverse document types such as resumes, research papers, invoices, and scanned images, keyword-based search fails to retrieve relevant information for complex user queries.

There is a need for a system that:
- Can process **any document format** (PDF, JPG, JPEG, PNG)
- Can **understand content semantically**, not just match keywords
- Can **answer natural language questions** about document content
- Can **cite source documents and pages** for every answer

---

## Objectives

- Build a universal AI-powered document analyzer supporting PDF, JPG, JPEG, and PNG formats
- Implement OCR using EasyOCR for text extraction from scanned documents and images
- Apply pretrained Sentence Transformer embeddings for semantic understanding
- Build a FAISS vector index for fast similarity-based retrieval
- Implement a RAG pipeline that grounds LLM answers in retrieved document content
- Provide a modern web interface for document upload, processing, and interactive Q&A
- Make the architecture extensible for future document types and models

---

## Existing System

| Limitation | Description |
|---|---|
| Keyword-only search | Cannot understand meaning, only matches exact terms |
| No multi-format support | Most tools handle only text-based PDFs |
| No question answering | Raw search results without synthesized answers |
| No source attribution | No way to verify which document contains the answer |
| No scanned document support | Cannot handle image-based or handwritten documents |

---

## Proposed System

| Feature | Implementation |
|---|---|
| Multi-format input | PDF, JPG, JPEG, PNG all supported |
| OCR for scanned docs | EasyOCR extracts text from images and scanned PDFs |
| Semantic understanding | all-MiniLM-L6-v2 Sentence Transformer embeddings |
| Fast vector retrieval | FAISS IndexFlatIP for exact inner-product search |
| Grounded Q&A | RAG pipeline prevents hallucination |
| Source citations | Every answer shows source file, page, chunk, similarity |
| Modern web interface | React + FastAPI with drag-and-drop upload |

---

## System Architecture

```
             DOCUMENT INPUT
              (PDF / JPG / PNG)
                    ↓
              OCR — EasyOCR
                    ↓
           TEXT EXTRACTION
                    ↓
            TEXT CLEANING
              (normalization)
                    ↓
               CHUNKING
            (300 words, 50 overlap)
                    ↓
      PRETRAINED TRANSFORMER
      sentence-transformers/all-MiniLM-L6-v2
                    ↓
             EMBEDDINGS
               (dim = 384)
                    ↓
           FAISS INDEX
          (IndexFlatIP)
                    ↓
         SEMANTIC SEARCH
              (Top-K)
                    ↓
          RELEVANT CHUNKS
                    ↓
           RAG PIPELINE
        (Prompt + Context)
                    ↓
           PRETRAINED LLM
          (Groq / OpenAI / HF)
                    ↓
            AI RESPONSE
         + SOURCE CITATIONS
```

---

## Technology Stack

| Category | Technology |
|---|---|
| **Frontend** | React 18, React Router, Vite, Framer Motion |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **OCR** | EasyOCR (pretrained English model) |
| **Embedding** | sentence-transformers/all-MiniLM-L6-v2 (pretrained) |
| **Vector Store** | FAISS (faiss-cpu) |
| **PDF Processing** | pdf2image, PyPDF2, Poppler |
| **Image Processing** | Pillow, OpenCV (headless) |
| **LLM** | Groq API (Llama3 8B) / OpenAI / HuggingFace |
| **Deep Learning** | PyTorch, HuggingFace Transformers |
| **Experimentation** | Kaggle Notebook, Jupyter |

---

## Dataset

The system is designed to work with **any document collection**. The initial testing uses a resume/CV dataset, but the architecture supports:

- **Resumes / CVs** — extract skills, experience, education
- **Research papers** — extract methods, results, conclusions
- **Invoices** — extract vendor, amounts, dates
- **Business reports** — extract key findings and metrics
- **Scanned documents** — any image-based document via OCR

### Dataset Format (for Kaggle notebook)

```
dataset/
  resumes/
    candidate_1.pdf
    candidate_2.jpg
    candidate_3.png
  ...
```

Supported: `.pdf`, `.jpg`, `.jpeg`, `.png`

> **The dataset is NOT included in this repository.** Upload your own dataset to Kaggle as described below.

---

## Preprocessing

1. **File validation** — check extension, file size, and corruption
2. **PDF handling** — attempt direct text extraction (PyPDF2), fall back to OCR for scanned pages
3. **Image handling** — load with Pillow, convert to RGB, upscale if needed for OCR
4. **Text cleaning**:
   - Normalize Unicode characters
   - Remove control characters and null bytes
   - Collapse excessive whitespace and newlines
   - Remove OCR divider artifacts (repeated `---`, `===`)
   - Preserve meaningful punctuation and document structure

---

## OCR

**Model:** EasyOCR (pretrained, no fine-tuning)

- Supports English language (configurable for multilingual)
- Runs on CPU (GPU optional)
- Applied to image files and scanned PDF pages
- PDF hybrid approach: use direct text extraction where available, OCR where needed
- Output: plain text per page

```
Image / PDF Page
      ↓
EasyOCR.readtext(paragraph=True)
      ↓
Raw text strings per region
      ↓
Joined and cleaned
      ↓
Page-level text
```

---

## Text Chunking

Documents are split into overlapping chunks before embedding.

| Parameter | Value | Purpose |
|---|---|---|
| `CHUNK_SIZE` | 300 words | Maximum words per chunk |
| `CHUNK_OVERLAP` | 50 words | Overlap to preserve context at boundaries |

Each chunk carries full metadata:

```json
{
  "document_id": "abc123",
  "filename": "Resume_John.pdf",
  "page": 2,
  "chunk_id": 7,
  "text": "...",
  "word_count": 295
}
```

---

## Pretrained Transformer

> **IMPORTANT NOTE:**
> We use the **pretrained** `sentence-transformers/all-MiniLM-L6-v2` Transformer model
> to generate semantic embeddings for document chunks and user queries.
> **We do NOT train this model from scratch.**
> The model is downloaded from HuggingFace Hub and used as-is.

The model was originally trained on a large corpus of sentence pairs using contrastive learning. It maps text of any length to a 384-dimensional dense vector where semantically similar texts are close together in the vector space.

---

## Embeddings

- **Model:** `sentence-transformers/all-MiniLM-L6-v2`
- **Dimension:** 384
- **Normalization:** L2-normalized for cosine similarity
- **Batch encoding:** 32 or 64 chunks per batch

Alternative model (swap via `.env`):
- `sentence-transformers/all-mpnet-base-v2` → 768-dim, higher accuracy

---

## FAISS Vector Search

**Index type:** `IndexFlatIP` (exact inner-product search)

When embeddings are L2-normalized, inner product equals cosine similarity.

| Parameter | Value |
|---|---|
| `TOP_K` | 5 (configurable) |
| `SIMILARITY_THRESHOLD` | 0.3 (configurable) |
| Index type | Exact search (no approximation) |

---

## Semantic Search

```
User Query
    ↓
embed_query(query) → 384-dim vector
    ↓
FAISS.search(query_vector, top_k=5)
    ↓
Top-K chunk indices + similarity scores
    ↓
Metadata lookup → source chunks with filenames, pages, similarity
```

---

## RAG Pipeline

```
User Question
    ↓
Question Embedding (all-MiniLM-L6-v2)
    ↓
FAISS Semantic Search → Top-K chunks
    ↓
Build grounded prompt:
  [Source 1: filename | Page X | Chunk Y]
  {chunk text}
  ...
  User Question: {question}
    ↓
LLM generates answer grounded in context
    ↓
Answer + Source Citations
```

If the answer is not found in retrieved chunks:
> *"I could not find this information in the uploaded documents."*

---

## LLM

LLM provider is **configurable** via `.env`:

| Provider | Config value | Model | Notes |
|---|---|---|---|
| Groq | `groq` | `openai/gpt-oss-20b` | **Recommended** — free tier, fast |
| OpenAI | `openai` | `gpt-3.5-turbo` | Paid API |
| HuggingFace | `huggingface` | `Mistral-7B-Instruct` | HF Inference API |
| Local | `local` | N/A | Returns retrieved context directly (no API needed) |

---

## System Workflow

```
1. User uploads document (PDF/JPG/PNG)
2. Backend saves file to uploads/
3. OCR extracts text from each page
4. Text is cleaned and chunked (300 words, 50 overlap)
5. all-MiniLM-L6-v2 generates embeddings for all chunks
6. Chunks + embeddings are added to FAISS index
7. User asks a question in the chat interface
8. Question is embedded and searched against FAISS
9. Top-5 most similar chunks are retrieved
10. RAG prompt is built with retrieved context
11. LLM generates a grounded answer
12. Answer + source citations are returned to the user
```

---

## Project Structure

```
Universal-AI-Document-Analyzer/
│
├── frontend/                          # React.js web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Navigation with backend status
│   │   │   ├── UploadZone.jsx         # Drag-and-drop file upload
│   │   │   ├── ProcessingSteps.jsx    # Pipeline step visualization
│   │   │   ├── ChatInterface.jsx      # RAG chat with source cards
│   │   │   ├── StatsBar.jsx           # Dashboard statistics
│   │   │   └── DocumentTable.jsx      # Document management table
│   │   ├── pages/
│   │   │   ├── AnalyzerPage.jsx       # Main upload + chat page
│   │   │   ├── DashboardPage.jsx      # Document management dashboard
│   │   │   └── DocumentPage.jsx       # Per-document Q&A + chunks
│   │   ├── services/
│   │   │   └── api.js                 # All API calls (Axios)
│   │   ├── App.jsx                    # Router + Toaster
│   │   ├── main.jsx                   # React entry point
│   │   └── index.css                  # Global design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                    # FastAPI app + CORS + lifespan
│   │   ├── config.py                  # Typed settings (pydantic-settings)
│   │   ├── routes/
│   │   │   ├── documents.py           # Upload, list, get, delete endpoints
│   │   │   ├── search.py              # Semantic search endpoint
│   │   │   └── chat.py                # RAG Q&A endpoint
│   │   ├── services/
│   │   │   ├── document_service.py    # Full pipeline orchestrator
│   │   │   ├── ocr_service.py         # EasyOCR integration
│   │   │   └── chunker.py             # Text chunking
│   │   ├── document_processing/
│   │   │   ├── pdf_processor.py       # PDF → images + direct extraction
│   │   │   ├── image_processor.py     # Image loading + preprocessing
│   │   │   └── text_cleaner.py        # Text normalization
│   │   ├── embeddings/
│   │   │   └── embedder.py            # SentenceTransformer singleton
│   │   ├── retrieval/
│   │   │   └── faiss_store.py         # FAISS vector store
│   │   ├── rag/
│   │   │   └── rag_pipeline.py        # RAG + LLM integration
│   │   └── models/
│   │       └── schemas.py             # Pydantic request/response schemas
│   ├── requirements.txt
│   └── .env.example
│
├── dashboard/                        # Business Analytics & Executive Intelligence
│   ├── index.html                    # Interactive dashboard interface
│   ├── style.css                     # Themes, cards, and responsive styles
│   ├── app.js                        # Analytics engine, Canvas charts & exports
│   ├── analytics_data.json           # Business telemetry benchmark data
│   ├── server.py                     # Dashboard HTTP server + FastAPI proxy
│   ├── export_report.py              # CLI executive briefing generator
│   ├── executive_report.md           # Generated markdown briefing
│   └── README.md                     # Dashboard metrics & formulas
│
├── training/
│   └── Universal_AI_Document_Analyzer.ipynb  # Kaggle experimentation notebook
│
├── artifacts/                         # Generated by Kaggle notebook
│   ├── faiss/
│   │   └── document_index.faiss       # FAISS vector index
│   ├── metadata/
│   │   └── chunks_metadata.pkl        # Chunk text + metadata
│   └── config.json                    # Artifact configuration
│
├── README.md
├── .gitignore
└── LICENSE
```

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- Poppler (for PDF processing)

#### Install Poppler

**Windows:**
```
Download from: https://github.com/oschwartz10612/poppler-windows/releases
Extract and add bin/ to your PATH environment variable
```

**Linux/Mac:**
```bash
sudo apt-get install poppler-utils    # Ubuntu/Debian
brew install poppler                   # macOS
```

---

## Kaggle Training / Experimentation

### Step 1: Create a Kaggle Account
Go to [kaggle.com](https://www.kaggle.com) and sign up.

### Step 2: Create a New Notebook
- Click **+ Create → New Notebook**
- Set the accelerator: CPU is sufficient; GPU is optional

### Step 3: Upload Your Dataset
- Click **Add Data → Upload Dataset**
- Upload a ZIP file containing your PDF/image documents
- Structure (recommended):
  ```
  dataset/
    resumes/
      doc1.pdf
      doc2.jpg
  ```

### Step 4: Upload the Notebook
- Upload `training/Universal_AI_Document_Analyzer.ipynb`
- Or copy-paste cells into a new notebook

### Step 5: Run All Cells
- The notebook auto-discovers your dataset
- All 15 stages execute sequentially
- Review-ready outputs are generated automatically

---

## Artifact Export

After the Kaggle notebook completes:

### Download Artifacts
1. Click **Output** in the Kaggle notebook sidebar
2. Download `/kaggle/working/artifacts/` folder (or ZIP)

### Place Artifacts
Copy the downloaded files into your local project:

```
artifacts/
  faiss/
    document_index.faiss     ← place here
  metadata/
    chunks_metadata.pkl       ← place here
  config.json                 ← place here
```

> **NOTE:** The backend can also build a fresh FAISS index at runtime
> when you upload documents through the web interface.
> Pre-built artifacts are for loading a pre-indexed dataset.

---

## Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy environment file
cp .env.example .env

# 6. Edit .env — add your LLM API key
# (Groq is recommended — free tier at console.groq.com)
notepad .env   # Windows
nano .env      # Linux/Mac

# 7. Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`  
API docs: `http://localhost:8000/api/docs`

---

## Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## Usage

### 1. Upload a Document
- Open `http://localhost:3000`
- Drag and drop a PDF, JPG, JPEG, or PNG onto the upload zone
- Click **Upload & Analyze**
- Watch the processing pipeline steps complete in real time

### 2. Ask Questions
- Type a question in the chat panel
- The AI retrieves relevant document sections and generates an answer
- Source citations appear below each answer with similarity scores

### 3. View Dashboard
- Click **Dashboard** to see all uploaded documents
- View document status, chunk count, and upload date
- Click **Ask AI** on any processed document for dedicated Q&A

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload & process a document |
| `GET` | `/api/documents` | List all documents |
| `GET` | `/api/documents/{id}` | Get a single document |
| `DELETE` | `/api/documents/{id}` | Delete a document |
| `GET` | `/api/documents/{id}/chunks` | Get indexed chunks |
| `GET` | `/api/documents/stats` | Dashboard statistics |
| `POST` | `/api/search` | Semantic search |
| `POST` | `/api/chat` | RAG question answering |
| `GET` | `/api/health` | Health check |

Full interactive docs: `http://localhost:8000/api/docs`

---

## Testing Instructions

### 1. Backend Health Check
```bash
curl http://localhost:8000/api/health
```

### 2. Upload a Test Document
```bash
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@/path/to/your/resume.pdf"
```

### 3. Search
```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Python programming skills", "top_k": 5}'
```

### 4. Chat (RAG)
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What skills does this candidate have?"}'
```

---

## Review 1 Demonstration Steps

1. **Open** `http://localhost:3000` — show the hero page with architecture
2. **Upload** a sample resume PDF — walk through the processing pipeline steps
3. **Show** extracted text and chunk count
4. **Ask** a question: *"What programming languages are mentioned?"*
5. **Show** the AI answer with source citations and similarity scores
6. **Open Dashboard** — show document stats and document table
7. **Open Kaggle Notebook** — walk through all 15 cells
8. **Show** the evaluation charts (P@K, R@K, similarity distribution, PCA)
9. **Show** the saved artifacts folder

---

## Future Enhancements

| Enhancement | Description |
|---|---|
| **LayoutLMv3** | Layout-aware document understanding (future integration) |
| **Multilingual OCR** | Support for non-English documents |
| **Multilingual embeddings** | LaBSE, paraphrase-multilingual models |
| **Table extraction** | Extract structured table data |
| **Invoice field extraction** | Key-value extraction for invoices |
| **Research paper summarization** | Auto-summarize academic papers |
| **Multi-document QA** | Answer questions spanning multiple documents |
| **Advanced RAG** | HyDE, re-ranking, query decomposition |
| **Local LLM** | Ollama integration for fully offline operation |
| **ChromaDB / Qdrant** | Alternative vector database support |
| **Fine-tuning** | Domain-specific fine-tuning of embedding model |
| **User authentication** | Secure multi-user access |

> **Note:** None of the above are currently implemented. They represent planned future work.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built as an academic Deep Learning / AI project. — 2024*
