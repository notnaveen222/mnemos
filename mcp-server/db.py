import os
from dotenv import load_dotenv
from supabase import create_client
from sentence_transformers import SentenceTransformer

load_dotenv()

_url = os.environ["SUPABASE_URL"]
_key = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(_url, _key)

_embedder = SentenceTransformer("all-MiniLM-L6-v2")


def embed_text(text: str) -> list[float]:
    return _embedder.encode(text).tolist()


def insert_memory(content: str, tags: list[str] | None = None) -> dict:
    embedding = embed_text(content)
    result = (
        supabase.table("memories")
        .insert({"content": content, "tags": tags, "embedding": embedding})
        .execute()
    )
    return result.data[0]


def get_all_memories(tag: str | None = None) -> list[dict]:
    query = supabase.table("memories").select("*").order("created_at")
    if tag is not None:
        query = query.contains("tags", [tag])
    return query.execute().data


def get_memories_by_time_range(start_iso: str, end_iso: str) -> list[dict]:
    result = (
        supabase.table("memories")
        .select("*")
        .gte("created_at", start_iso)
        .lte("created_at", end_iso)
        .order("created_at")
        .execute()
    )
    return result.data


def search_memories_by_meaning(query: str, match_count: int = 5) -> list[dict]:
    query_embedding = embed_text(query)
    result = supabase.rpc(
        "match_memories",
        {"query_embedding": query_embedding, "match_count": match_count},
    ).execute()
    return result.data


def delete_memory(memory_id: str) -> bool:
    result = supabase.table("memories").delete().eq("id", memory_id).execute()
    return len(result.data) > 0
