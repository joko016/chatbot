export default async function handler(req, res) {
  // Enable CORS for your website
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://www.theexaltedchrist.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;

    const messages = [
      {
        role: 'system',
        content: context + '\n\nIMPORTANT: Keep responses concise and helpful. Include relevant links to pages on theexaltedchrist.com when appropriate.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: messages
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.status(200).json({ 
      response: data.content[0].text 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again.' 
    });
  }
}
