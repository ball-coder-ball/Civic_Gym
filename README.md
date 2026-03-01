# Civic Gym - Directory Structure Overview

This directory contains the Zero-Cost Prototype MVP for Civic Gym.

## Architecture Highlights
- **`frontend/`**: Next.js (App Router), Zustand (State), TailwindCSS, Shadcn/ui.
  - See `frontend/src/store/useChatStore.ts` for the 5-turn state manager.
- **`backend/`**: FastAPI, ChromaDB (Local persistent vector store), Python.
  - See `backend/app/main.py` for Module 2 RAG evaluation logic with DeepSeek R1 API.
  - See `backend/app/utils/llm_parser.py` for stripping `<think>` reasoning tags safely.
- **`supabase/`**: PostgreSQL Database Schema.
  - See `supabase/schema.sql` for definitions of user profiles, 5-turn gameplay sessions, scoring, and automated Auth triggers.

## Quick Start (Backend)
1. `cd backend`
2. `pip install fastapi uvicorn chromadb httpx pydantic`
3. Set your environment variable: `export DEEPSEEK_API_KEY="your-key-here"`
4. Start local server: `uvicorn app.main:app --reload`
