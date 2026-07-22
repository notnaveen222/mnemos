import math
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client

load_dotenv()

_url = os.environ["SUPABASE_URL"]
_key = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(_url, _key)

# Embeddings come from Google's hosted API (free tier, no credit card) instead
# of a local model, so this server stays small enough to run serverless on
# Vercel. gemini-embedding-001 at 768 dims matches the memories.embedding
# vector(768) column.
_genai = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIM = 768


def embed_text(text: str) -> list[float]:
    resp = _genai.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=EMBED_DIM),
    )
    values = resp.embeddings[0].values
    # Gemini embeddings below 3072 dims aren't returned pre-normalized; normalize
    # so distance comparisons in Postgres stay consistent.
    norm = math.sqrt(sum(v * v for v in values))
    return [v / norm for v in values] if norm else values


def insert_memory(user_id: str, content: str, tags: list[str] | None = None) -> dict:
    embedding = embed_text(content)
    result = (
        supabase.table("memories")
        .insert({"content": content, "tags": tags, "embedding": embedding, "user_id": user_id})
        .execute()
    )
    return result.data[0]


def get_all_memories(user_id: str, tag: str | None = None) -> list[dict]:
    query = (
        supabase.table("memories")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at")
    )
    if tag is not None:
        query = query.contains("tags", [tag])
    return query.execute().data


def get_memories_by_time_range(user_id: str, start_iso: str, end_iso: str) -> list[dict]:
    result = (
        supabase.table("memories")
        .select("*")
        .eq("user_id", user_id)
        .gte("created_at", start_iso)
        .lte("created_at", end_iso)
        .order("created_at")
        .execute()
    )
    return result.data


def search_memories_by_meaning(user_id: str, query: str, match_count: int = 5) -> list[dict]:
    query_embedding = embed_text(query)
    result = supabase.rpc(
        "match_memories",
        {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": match_count,
        },
    ).execute()
    return result.data


def delete_memory(user_id: str, memory_id: str) -> bool:
    result = (
        supabase.table("memories")
        .delete()
        .eq("id", memory_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(result.data) > 0
