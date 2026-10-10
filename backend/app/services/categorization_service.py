"""
MazikDLP - Prompt Categorization Service
Keyword-based classifier for prompt intent.
"""

CATEGORIES: dict[str, list[str]] = {
    "coding": [
        "code", "function", "debug", "error", "implement", "refactor", "API",
        "algorithm", "class", "method", "bug", "compile", "syntax", "script",
        "library", "framework", "module", "variable", "loop", "recursion",
    ],
    "data_analysis": [
        "analyze", "data", "dataset", "statistics", "chart", "visualization",
        "metrics", "trend", "graph", "plot", "correlation", "regression",
        "distribution", "average", "mean", "median", "outlier",
    ],
    "research": [
        "research", "explain", "how does", "what is", "compare", "difference between",
        "overview", "history", "definition", "concept", "theory", "hypothesis",
        "evidence", "study", "paper", "journal",
    ],
    "document_generation": [
        "write", "draft", "email", "letter", "report", "proposal", "template",
        "document", "essay", "article", "blog", "post", "memo", "newsletter",
        "press release", "cover letter",
    ],
    "summarization": [
        "summarize", "summary", "key points", "tldr", "brief", "overview of",
        "main ideas", "highlights", "recap", "condense", "shorten",
    ],
    "business": [
        "strategy", "revenue", "customer", "market", "competitor", "business plan",
        "ROI", "KPI", "stakeholder", "budget", "forecast", "sales", "marketing",
        "product", "launch", "startup", "investor",
    ],
    "learning": [
        "teach", "tutorial", "learn", "example", "practice", "exercise",
        "concept", "beginner", "course", "lesson", "quiz", "explain to me",
        "how to", "step by step",
    ],
}


def categorize(text: str) -> str:
    """
    Returns the most likely category for the given text.
    Falls back to 'general' if no keywords match.
    """
    text_lower = text.lower()
    scores: dict[str, int] = {}

    for category, keywords in CATEGORIES.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score > 0:
            scores[category] = score

    if not scores:
        return "general"

    return max(scores, key=lambda k: scores[k])


def categorize_with_scores(text: str) -> dict[str, int]:
    """Returns all categories with their keyword match counts."""
    text_lower = text.lower()
    return {
        cat: sum(1 for kw in kws if kw.lower() in text_lower)
        for cat, kws in CATEGORIES.items()
    }
