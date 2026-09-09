export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Messaggio mancante" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json({
        error: "Errore durante la chiamata a OpenAI",
        details: data,
      });
    }

    const answer = data.output_text;

    return res.status(200).json({
      answer: answer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Errore interno del server",
    });
  }
}
