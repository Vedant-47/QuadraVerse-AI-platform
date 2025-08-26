def summarize(text: str) -> str:
    # Simple mock summarizer that only returns first 3 sentences
    sentences = text.split(". ")
    summary = ". ".join(sentences[:3]) + "."
    return summary
