"""Text cleaning shared by training and inference (must be identical in both)."""
import re

# Filler phrases operators add that carry no signal ("FYI", "please check asap", ...)
_FILLER = re.compile(
    r"\b(fyi|urgent|pls|please|check|asap|reported by operator|not first time|again)\b",
    re.IGNORECASE,
)


def incident_text(title: str, description: str | None) -> str:
    """Combine title + description into the single text the models read."""
    return f"{title or ''}. {description or ''}".strip()


def clean(text: str) -> str:
    text = text.lower()
    text = _FILLER.sub(" ", text)
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()
