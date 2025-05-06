// chatGptService.js - Create this new file in the same directory
export async function callChatGpt(prompt) {
    const apiKey ="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";
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a financial advisor assistant helping to analyze financial data for relationship managers at a bank."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
  
      const data = await response.json();
      
      if (data.error) {
        console.error("API Error:", data.error);
        return "无法获取 AI 分析，请稍后再试。";
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling ChatGPT API:", error);
      return "无法获取 AI 分析，请稍后再试。";
    }
  }