from mcp.server.fastmcp import FastMCP

mcp = FastMCP("mnemos", 
              instructions="Provides tools that help LLMs store {remember(content)} and retrieve {recall(query)} some context. ")

memories: list[str] = []

@mcp.tool()
def remember(content: str) -> str:
    """Save a fact to the user's persistent memory so it can be recalled later."""
    memories.append(content)
    return f"Saved. You now have {len(memories)} memories."

@mcp.tool()
def recall(query: str) -> str:
    """Search the user's saved memories for anything relevant to the query and return the matches."""
    query_words = query.lower().split()
    matches = [
        memory
        for memory in memories
        if any(word in memory.lower() for word in query_words)
    ]
    if not matches:
        return "No matching memories found."
    return "\n".join(f"- {memory}" for memory in matches)

if __name__=="__main__":
    mcp.run()
