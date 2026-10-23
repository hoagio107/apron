export async function askGemini(model: string, prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Vui lòng nhập Gemini API Key trong phần Cài đặt.');
  }

  try {
    // Dynamically import tauri fetch to avoid circular dependencies if any
    const tauriFetch = window.fetch;
    const response = await tauriFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (resultText) {
      return resultText;
    }
    throw new Error('No response content from Gemini');
  } catch (error) {
    console.error('Error asking Gemini:', error);
    throw error;
  }
}
