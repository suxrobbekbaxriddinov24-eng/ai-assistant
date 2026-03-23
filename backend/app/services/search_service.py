import httpx
from app.config import get_settings

settings = get_settings()


async def web_search(query: str, num_results: int = 5) -> list[dict]:
    """Search the web using Serper API. Returns list of results."""
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            json={"q": query, "num": num_results},
            headers={
                "X-API-KEY": settings.serper_api_key,
                "Content-Type": "application/json"
            }
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("organic", [])[:num_results]:
        results.append({
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": item.get("snippet", ""),
        })
    return results


def format_search_results(results: list[dict]) -> str:
    """Format search results as readable text for the AI."""
    if not results:
        return "No search results found."
    lines = []
    for i, r in enumerate(results, 1):
        lines.append(f"{i}. **{r['title']}**\n   {r['snippet']}\n   Source: {r['link']}")
    return "\n\n".join(lines)
