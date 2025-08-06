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
        system: `${context}

CRITICAL: You must NEVER use HTML tags in your responses. This is extremely important.
- Do NOT use <a href="...">text</a> format
- Do NOT use any < or > symbols except for Bible verse references
- Do NOT use markdown links like [text](url)
- ONLY write plain text with bare URLs

When sharing any link, write it as plain text like this:
"You can visit our store at: https://www.theexaltedchrist.com/store"

The system will automatically make URLs clickable. You must never format them yourself.

If you use any HTML tags, the system will break. Only respond with plain text and bare URLs.`,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error details:', errorData);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extra safety: strip any HTML that might have slipped through
    let responseText = data.content[0].text;
    
    // Remove any HTML tags including malformed ones like <;/a>
    responseText = responseText.replace(/<[^>]*>/g, '');
    responseText = responseText.replace(/<;\/[^>]*>/g, '');
    
    // Extract URLs from any anchor tags that might exist
    responseText = responseText.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<[;\/]*a>/gi, '$1');
    
    // Clean up any HTML entities
    responseText = responseText.replace(/&lt;/g, '<');
    responseText = responseText.replace(/&gt;/g, '>');
    responseText = responseText.replace(/&amp;/g, '&');
    responseText = responseText.replace(/&quot;/g, '"');
    responseText = responseText.replace(/&#39;/g, "'");
    
    res.status(200).json({ 
      response: responseText 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again.' 
    });
  }
}
