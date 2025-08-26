async function summarizeText() {
  const inputText = document.getElementById("summaryInput").value;

  if (!inputText.trim()) {
    alert("Please enter some text to summarize.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: inputText }),
    });

    const data = await response.json();
    document.getElementById("summaryOutput").innerText = data.summary;
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to connect to summarizer API.");
  }
}
