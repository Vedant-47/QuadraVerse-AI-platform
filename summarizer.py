import subprocess

def summarize(text: str) -> str:
    """
    Summarize text into 3-5 bullet points using Ollama (llama3).
    """
    prompt = f"""
    You are a precise summarization AI.
    Summarize the following text into 3-5 short, **concise bullet points**.
    Each bullet must start with "- " and be on a **new line**.
    Do not rewrite sentences. Only extract key facts.

    Text:
    {text}
    """

    try:
        result = subprocess.run(
            ["ollama", "run", "llama3"],
            input=prompt.encode("utf-8"),
            capture_output=True,
            check=True
        )
        summary = result.stdout.decode("utf-8").strip()
        return summary
    except subprocess.CalledProcessError as e:
        return f"Error: Ollama returned an error.\n{e.stderr.decode('utf-8') if e.stderr else ''}"
    except FileNotFoundError:
        return "Error: Ollama is not installed or not in PATH. Install from https://ollama.ai"
    except Exception as e:
        return f"Error: {str(e)}"
