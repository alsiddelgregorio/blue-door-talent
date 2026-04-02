async function askAI() {
  const question = document.getElementById("question").value;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDRGtiBmS6Byk9WaETX3_055gxqUJXnD7w",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }]
      })
    }
  );

  const data = await response.json();
  document.getElementById("answer").innerText =
    data.candidates[0].content.parts[0].text;
}