"""
/app/insurance/rag.py

Insurance document RAG (Retrieval-Augmented Generation) pipeline.

Pipeline
--------
1. Upload PDF → extract text (PyMuPDF primary; mock-OCR fallback).
2. Chunk text with overlap into fixed-size windows.
3. Embed each chunk via a sentence-transformer model (or mock in tests).
4. Store chunks + embeddings in an in-process vector store.
5. Query: embed question → cosine-similarity retrieval → top-K chunks.
6. Generate: strict JSON response from an LLM, grounded strictly in context.

LLM contract
------------
The system prompt forbids the model from using outside knowledge.
Output is always a JSON object with keys:
  - simple_explanation : str
  - clause_reference   : str | null
  - confidence_level   : "High" | "Medium" | "Low"
  - fallback           : str | null  (populated when answer not in docs)

Confidence mapping
------------------
  cosine similarity ≥ 0.80  → High
  cosine similarity ≥ 0.50  → Medium
  cosine similarity <  0.50  → Low   (and fallback is set)
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config (env-overridable)
# ---------------------------------------------------------------------------
CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "400"))          # tokens ≈ chars / 4
CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "80"))
TOP_K: int = int(os.getenv("RAG_TOP_K", "4"))
CONFIDENCE_HIGH: float = float(os.getenv("RAG_CONF_HIGH", "0.80"))
CONFIDENCE_MED: float = float(os.getenv("RAG_CONF_MED", "0.50"))
EMBEDDING_DIM: int = 384   # matches all-MiniLM-L6-v2

FALLBACK_MESSAGE = (
    "I was unable to find a specific answer to your question within the "
    "provided insurance document. Please consult your insurer or a licensed advisor."
)

# ---------------------------------------------------------------------------
# RAG response schema
# ---------------------------------------------------------------------------
@dataclass
class RAGResponse:
    simple_explanation: str
    clause_reference: str | None
    confidence_level: str          # "High" | "Medium" | "Low"
    fallback: str | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "simple_explanation": self.simple_explanation,
            "clause_reference": self.clause_reference,
            "confidence_level": self.confidence_level,
            "fallback": self.fallback,
        }


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Primary: PyMuPDF (fitz).
    Fallback: mock OCR returning a placeholder string (test/CI environments).
    """
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages: list[str] = []
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text("text")
            # Annotate with page number so clause_reference can cite it
            pages.append(f"[Page {page_num}]\n{text.strip()}")
        doc.close()
        return "\n\n".join(pages)
    except ImportError:
        logger.warning("PyMuPDF not installed; using mock OCR fallback")
        return _mock_ocr(pdf_bytes)
    except Exception as exc:
        logger.error("PDF extraction failed: %s; using mock OCR", exc)
        return _mock_ocr(pdf_bytes)


def _mock_ocr(pdf_bytes: bytes) -> str:
    """
    Deterministic mock for tests: returns a tiny synthetic insurance doc.
    The content is keyed by a hash of the bytes so different PDFs produce
    different (but stable) results.
    """
    digest = hashlib.sha256(pdf_bytes).hexdigest()[:8]
    return (
        f"[Page 1]\n"
        f"INSURANCE POLICY DOCUMENT (mock OCR — digest {digest})\n\n"
        f"Clause 1.1 — Coverage: This policy covers hospitalisation expenses "
        f"up to INR 5,00,000 per annum.\n\n"
        f"Clause 2.3 — Exclusions: Pre-existing conditions are excluded for "
        f"the first 24 months.\n\n"
        f"[Page 2]\n"
        f"Clause 3.1 — Claim Process: Submit claims within 30 days of discharge.\n\n"
        f"Clause 4.0 — Premium: Annual premium is INR 12,000 inclusive of GST.\n"
    )


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
@dataclass
class Chunk:
    chunk_id: str
    document_id: str
    text: str
    page_hint: str | None   # e.g. "Page 2" parsed from the [Page N] marker
    char_start: int
    char_end: int


def chunk_text(
    text: str,
    document_id: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[Chunk]:
    """
    Split `text` into overlapping character windows.
    Attempts to break on sentence boundaries ('. ') within a tolerance.
    Extracts [Page N] markers to populate `page_hint`.
    """
    chunks: list[Chunk] = []
    pos = 0
    text_len = len(text)

    while pos < text_len:
        end = min(pos + chunk_size, text_len)

        # Try to snap end to sentence boundary within last 20% of window
        snap_start = max(pos, end - chunk_size // 5)
        boundary = text.rfind(". ", snap_start, end)
        if boundary != -1:
            end = boundary + 2  # include ". "

        window = text[pos:end]

        # Extract page hint from nearest [Page N] marker
        page_hint: str | None = None
        match = re.search(r"\[Page (\d+)\]", window)
        if match:
            page_hint = f"Page {match.group(1)}"
        else:
            # Walk backwards in text to find the last page marker before pos
            preceding = text[:pos]
            back_match = list(re.finditer(r"\[Page (\d+)\]", preceding))
            if back_match:
                page_hint = f"Page {back_match[-1].group(1)}"

        chunks.append(
            Chunk(
                chunk_id=str(uuid.uuid4()),
                document_id=document_id,
                text=window.strip(),
                page_hint=page_hint,
                char_start=pos,
                char_end=end,
            )
        )

        pos = end - overlap
        if pos <= 0:
            break

    return chunks


# ---------------------------------------------------------------------------
# Embedding  (real or mock)
# ---------------------------------------------------------------------------
def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


class EmbeddingModel:
    """
    Wraps sentence-transformers with a keyword-frequency mock fallback.
    The mock is deterministic and sufficient for unit tests.
    """

    def __init__(self) -> None:
        self._model = None
        self._use_mock = False
        self._load()

    def _load(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence-transformer loaded: all-MiniLM-L6-v2")
        except Exception as exc:
            logger.warning("Sentence-transformer unavailable (%s); using mock embeddings", exc)
            self._use_mock = True

    def embed(self, texts: list[str]) -> list[list[float]]:
        if self._use_mock:
            return [self._mock_embed(t) for t in texts]
        embeddings = self._model.encode(texts, normalize_embeddings=True)
        return [e.tolist() for e in embeddings]

    @staticmethod
    def _mock_embed(text: str) -> list[float]:
        """
        Deterministic keyword-frequency vector of dimension EMBEDDING_DIM.
        Good enough for retrieval tests; not production-quality.
        """
        vec = [0.0] * EMBEDDING_DIM
        words = re.findall(r"\w+", text.lower())
        for word in words:
            idx = hash(word) % EMBEDDING_DIM
            vec[idx] += 1.0
        # L2 normalise
        mag = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / mag for v in vec]


# ---------------------------------------------------------------------------
# Vector store (in-process; replace with pgvector / Pinecone in prod)
# ---------------------------------------------------------------------------
@dataclass
class VectorStore:
    chunks: list[Chunk] = field(default_factory=list)
    embeddings: list[list[float]] = field(default_factory=list)

    def add(self, chunks: list[Chunk], embeddings: list[list[float]]) -> None:
        self.chunks.extend(chunks)
        self.embeddings.extend(embeddings)

    def query(self, query_embedding: list[float], top_k: int = TOP_K) -> list[tuple[Chunk, float]]:
        if not self.chunks:
            return []
        scored = [
            (chunk, _cosine_similarity(query_embedding, emb))
            for chunk, emb in zip(self.chunks, self.embeddings)
        ]
        scored.sort(key=lambda x: -x[1])
        return scored[:top_k]

    def clear_document(self, document_id: str) -> None:
        pairs = [
            (c, e) for c, e in zip(self.chunks, self.embeddings)
            if c.document_id != document_id
        ]
        self.chunks = [p[0] for p in pairs]
        self.embeddings = [p[1] for p in pairs]


# ---------------------------------------------------------------------------
# LLM caller
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """You are an insurance document assistant for the Bodhi app.
Your ONLY source of knowledge is the document excerpts provided below.
You MUST NOT use outside knowledge, training data, or general insurance expertise.
If the answer cannot be found in the excerpts, you must set fallback to the standard message.

Respond ONLY with a valid JSON object — no markdown, no prose, no code fences.
The JSON must have exactly these keys:
  "simple_explanation" : string — plain-English answer using only the excerpts.
  "clause_reference"   : string or null — exact clause/page reference from the text.
  "confidence_level"   : "High", "Medium", or "Low".
  "fallback"           : string or null — standard fallback message if not found, else null.
"""

_FALLBACK_RESPONSE = RAGResponse(
    simple_explanation="The requested information could not be located in the document.",
    clause_reference=None,
    confidence_level="Low",
    fallback=FALLBACK_MESSAGE,
)


def _extract_json_object(raw: str) -> dict[str, Any]:
    """Extract and parse the first JSON object from model output."""
    cleaned = raw.strip()

    # Handle fenced markdown responses defensively.
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in model response")

    return json.loads(cleaned[start : end + 1])


def _call_llm(context: str, question: str, confidence_level: str) -> RAGResponse:
    """
    Call Gemini with a grounded prompt.
    Falls back to a structured error response on any failure.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.warning("GEMINI_API_KEY not set; returning mock LLM response")
        return _mock_llm_response(context, question, confidence_level)

    try:
        import google.generativeai as genai

        genai.configure(api_key=gemini_key)

        user_message = (
            f"DOCUMENT EXCERPTS:\n{context}\n\n"
            f"QUESTION: {question}\n\n"
            f"Confidence level based on retrieval: {confidence_level}\n\n"
            f"Answer strictly from the excerpts above."
        )

        model = genai.GenerativeModel(
            model_name=os.getenv("LLM_MODEL", "gemini-1.5-flash"),
            system_instruction=_SYSTEM_PROMPT,
        )

        response = model.generate_content(
            user_message,
            generation_config={
                "temperature": 0.0,
                "response_mime_type": "application/json",
            },
        )

        raw = (response.text or "").strip()
        data = _extract_json_object(raw)
        return RAGResponse(
            simple_explanation=data.get("simple_explanation", ""),
            clause_reference=data.get("clause_reference"),
            confidence_level=data.get("confidence_level", confidence_level),
            fallback=data.get("fallback"),
        )

    except Exception as exc:
        logger.exception("LLM call failed: %s", exc)
        return _FALLBACK_RESPONSE


def _mock_llm_response(context: str, question: str, confidence_level: str) -> RAGResponse:
    """
    Deterministic mock for test/dev environments.
    Returns the first non-empty sentence from context as the explanation.
    """
    sentences = [s.strip() for s in context.split(".") if len(s.strip()) > 20]
    explanation = sentences[0] + "." if sentences else "See document for details."

    # Try to find a clause reference in the context
    clause_match = re.search(r"Clause\s+[\d.]+", context)
    page_match = re.search(r"\[Page (\d+)\]", context)
    clause_ref: str | None = None
    if clause_match:
        clause_ref = clause_match.group(0)
    elif page_match:
        clause_ref = f"Page {page_match.group(1)}"

    fallback = FALLBACK_MESSAGE if confidence_level == "Low" else None

    return RAGResponse(
        simple_explanation=explanation,
        clause_reference=clause_ref,
        confidence_level=confidence_level,
        fallback=fallback,
    )


# ---------------------------------------------------------------------------
# RAG pipeline
# ---------------------------------------------------------------------------
class InsuranceRAG:
    """
    Singleton-style RAG pipeline. Owns the vector store and embedding model.
    In production replace the in-process vector store with pgvector.
    """

    def __init__(self) -> None:
        self.embedding_model = EmbeddingModel()
        self.vector_store = VectorStore()
        # document_id → metadata
        self._documents: dict[str, dict[str, Any]] = {}

    def ingest(
        self,
        pdf_bytes: bytes,
        document_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Full ingestion: extract → chunk → embed → store.
        Returns ingestion summary.
        """
        document_id = document_id or str(uuid.uuid4())

        # Remove old chunks for this doc (re-ingestion)
        self.vector_store.clear_document(document_id)

        text = extract_text_from_pdf(pdf_bytes)
        chunks = chunk_text(text, document_id)
        texts = [c.text for c in chunks]
        embeddings = self.embedding_model.embed(texts)
        self.vector_store.add(chunks, embeddings)

        self._documents[document_id] = {
            "document_id": document_id,
            "chunk_count": len(chunks),
            "char_count": len(text),
            "metadata": metadata or {},
        }

        logger.info(
            "Document ingested: id=%s chunks=%d chars=%d",
            document_id, len(chunks), len(text),
        )
        return self._documents[document_id]

    def query(self, question: str, document_id: str | None = None) -> RAGResponse:
        """
        Retrieve top-K chunks and generate a grounded JSON response.
        If document_id is specified, only chunks from that doc are considered.
        """
        q_embedding = self.embedding_model.embed([question])[0]
        candidates = self.vector_store.query(q_embedding, top_k=TOP_K * 2)

        # Filter by document if requested
        if document_id:
            candidates = [(c, s) for c, s in candidates if c.document_id == document_id]

        candidates = candidates[:TOP_K]

        if not candidates:
            return _FALLBACK_RESPONSE

        top_score = candidates[0][1]

        # Map similarity score → confidence
        if top_score >= CONFIDENCE_HIGH:
            confidence = "High"
        elif top_score >= CONFIDENCE_MED:
            confidence = "Medium"
        else:
            confidence = "Low"

        # Build context string for the LLM
        context_parts: list[str] = []
        for chunk, score in candidates:
            header = f"[{chunk.page_hint or 'Unknown page'} | score={score:.3f}]"
            context_parts.append(f"{header}\n{chunk.text}")
        context = "\n\n---\n\n".join(context_parts)

        return _call_llm(context, question, confidence)

    def list_documents(self) -> list[dict[str, Any]]:
        return list(self._documents.values())


# Module-level singleton
rag_pipeline = InsuranceRAG()
