"""
MazikDLP - Prompt Categorizer
Keyword-based scoring system to classify prompts into usage categories.
"""
from __future__ import annotations

# ─── Category definitions ────────────────────────────────────────────────────
# Each category has a label, a hex color (for UI), and a dict of
# keyword → score pairs. Longer / more specific phrases score higher.
# Scoring rule: sum all matching keyword scores; highest total wins.
# Ties are resolved by the order below (first defined wins).
# If no category exceeds score 0, the prompt is "miscellaneous".

CATEGORIES: dict[str, dict] = {
    "coding": {
        "label": "Coding & Development",
        "color": "#6366f1",
        "keywords": {
            # Language / runtime names (high signal)
            "python": 3, "javascript": 3, "typescript": 3, "java": 3, "golang": 3,
            "rust": 3, "swift": 3, "kotlin": 3, "ruby": 3, "php": 3,
            "c++": 3, "c#": 3, "bash": 3, "powershell": 3,
            # Tooling
            "docker": 3, "kubernetes": 3, "terraform": 3, "ansible": 3,
            "react": 3, "nextjs": 3, "django": 3, "fastapi": 3, "flask": 3,
            "git": 2, "github": 2, "gitlab": 2, "ci/cd": 3, "pipeline": 2,
            # Code constructs
            "function": 3, "class": 2, "import": 3, "def ": 3, "async": 2,
            "algorithm": 3, "recursion": 3, "unit test": 3, "refactor": 3,
            "api endpoint": 3, "rest api": 3, "graphql": 3, "webhook": 3,
            "sql query": 3, "migration": 2, "schema": 2,
            # Generic but strong in context
            "code": 2, "debug": 3, "bug": 2, "error": 2, "compile": 3,
            "script": 2, "repository": 2, "deploy": 2, "devops": 3,
        },
    },
    "writing": {
        "label": "Writing & Content",
        "color": "#ec4899",
        "keywords": {
            "write": 2, "draft": 2, "essay": 3, "blog": 3, "article": 2,
            "newsletter": 3, "press release": 3, "copywriting": 3, "headline": 3,
            "email": 2, "cold email": 3, "cover letter": 3, "story": 2,
            "rewrite": 3, "proofread": 3, "grammar": 3, "paraphrase": 3,
            "social media": 3, "caption": 2, "content": 2, "tone": 2,
            "creative writing": 3, "narrative": 3, "poem": 3, "lyrics": 3,
            "introduction": 2, "conclusion": 2, "outline": 2, "paragraph": 2,
        },
    },
    "research": {
        "label": "Research & Learning",
        "color": "#0ea5e9",
        "keywords": {
            "explain": 2, "what is": 2, "how does": 2, "define": 2, "describe": 2,
            "research": 3, "literature review": 3, "case study": 3, "thesis": 3,
            "citation": 3, "academic": 3, "study": 2, "survey": 2, "hypothesis": 3,
            "compare": 2, "difference between": 2, "pros and cons": 3,
            "history of": 2, "overview": 2, "concept": 2, "theory": 2,
            "tutorial": 3, "step by step": 2, "guide": 2,
        },
    },
    "data_analysis": {
        "label": "Data Analysis",
        "color": "#f59e0b",
        "keywords": {
            "dataset": 3, "analyze": 3, "analysis": 3, "statistics": 3,
            "chart": 2, "graph": 2, "visualization": 3, "dashboard": 2,
            "correlation": 3, "regression": 3, "machine learning": 3,
            "csv": 3, "excel": 3, "pandas": 3, "numpy": 3, "tableau": 3,
            "power bi": 3, "kpi": 3, "metric": 2, "trend": 2, "forecast": 3,
            "pivot table": 3, "aggregate": 3, "outlier": 3, "cluster": 3,
            "prediction": 3, "model accuracy": 3, "confusion matrix": 3,
        },
    },
    "financial": {
        "label": "Finance & Accounting",
        "color": "#10b981",
        "keywords": {
            "invoice": 3, "budget": 3, "revenue": 3, "expense": 3, "profit": 3,
            "tax": 3, "financial": 3, "accounting": 3, "audit": 3,
            "investment": 3, "portfolio": 3, "stock": 3, "cash flow": 3,
            "balance sheet": 3, "income statement": 3, "roi": 3, "payroll": 3,
            "insurance": 2, "loan": 3, "mortgage": 3, "equity": 3,
            "financial model": 3, "valuation": 3, "p&l": 3,
        },
    },
    "legal": {
        "label": "Legal & Compliance",
        "color": "#8b5cf6",
        "keywords": {
            "contract": 3, "agreement": 3, "legal": 3, "regulation": 3,
            "compliance": 3, "gdpr": 3, "nda": 3, "intellectual property": 3,
            "trademark": 3, "patent": 3, "copyright": 3, "lawsuit": 3,
            "liability": 3, "clause": 3, "jurisdiction": 3, "attorney": 3,
            "terms of service": 3, "privacy policy": 3, "indemnity": 3,
            "arbitration": 3, "court": 2, "law": 2,
        },
    },
    "hr_recruitment": {
        "label": "HR & Recruitment",
        "color": "#f97316",
        "keywords": {
            "resume": 3, "cv": 2, "job description": 3, "interview": 3,
            "hire": 2, "candidate": 3, "onboarding": 3, "recruitment": 3,
            "performance review": 3, "okr": 3, "kra": 3, "appraisal": 3,
            "offer letter": 3, "employee handbook": 3, "training plan": 3,
            "workforce": 3, "talent": 2, "hr policy": 3, "leave policy": 3,
            "feedback": 2, "exit interview": 3,
        },
    },
    "customer_support": {
        "label": "Customer Support",
        "color": "#06b6d4",
        "keywords": {
            "customer complaint": 3, "support ticket": 3, "refund": 3,
            "escalate": 3, "troubleshoot": 3, "faq": 3, "help center": 3,
            "user query": 3, "follow up": 2, "customer satisfaction": 3,
            "churn": 3, "response template": 3, "live chat": 3,
            "customer": 2, "support": 2, "ticket": 3, "complaint": 3,
        },
    },
    "healthcare": {
        "label": "Healthcare & Medical",
        "color": "#ef4444",
        "keywords": {
            "patient": 3, "medical": 3, "diagnosis": 3, "treatment": 3,
            "symptom": 3, "clinical": 3, "hospital": 3, "prescription": 3,
            "drug": 3, "medicine": 3, "disease": 3, "surgery": 3,
            "vaccine": 3, "test result": 3, "health record": 3,
            "ehr": 3, "icd": 3, "therapy": 3, "dosage": 3, "healthcare": 3,
        },
    },
    "miscellaneous": {
        "label": "Miscellaneous",
        "color": "#94a3b8",
        "keywords": {},
    },
}

# Pre-compute sorted keyword list per category (longest phrases first to match greedily)
_SORTED_KEYWORDS: dict[str, list[tuple[str, int]]] = {
    cat: sorted(cfg["keywords"].items(), key=lambda kv: -len(kv[0]))
    for cat, cfg in CATEGORIES.items()
    if cat != "miscellaneous"
}


def categorize(text: str) -> str:
    """
    Return the best-matching category name for the given prompt text.

    Scoring:
    - Search for each keyword (case-insensitive) in the lowercased text.
    - Sum the score for every match found.
    - The category with the highest total score wins.
    - Ties → first category in definition order wins (more specific first).
    - Score = 0 for all categories → "miscellaneous".
    """
    text_lower = text.lower()
    best_cat = "miscellaneous"
    best_score = 0

    for cat, kw_list in _SORTED_KEYWORDS.items():
        score = 0
        for keyword, weight in kw_list:
            if keyword in text_lower:
                score += weight
        if score > best_score:
            best_score = score
            best_cat = cat

    return best_cat


def get_category_meta(category: str) -> dict:
    """Return {label, color} for a category key."""
    cfg = CATEGORIES.get(category, CATEGORIES["miscellaneous"])
    return {"label": cfg["label"], "color": cfg["color"]}


def all_categories() -> list[dict]:
    """Return list of {key, label, color} for all categories."""
    return [
        {"key": k, "label": v["label"], "color": v["color"]}
        for k, v in CATEGORIES.items()
    ]
