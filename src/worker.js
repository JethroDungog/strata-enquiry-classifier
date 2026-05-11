import html from '../index.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve the HTML file
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders }
      });
    }

    // Handle the analysis API
    if (url.pathname === '/api/analyse' && request.method === 'POST') {
      try {
        const body = await request.json();
        const text = body.text;

        if (!text) {
          return new Response(JSON.stringify({ error: 'No text provided' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const systemPrompt = `You are an AI triage assistant for Strata Management Consultants, a business advisory and brokerage firm. Your job is to classify incoming client enquiries and help staff respond efficiently.

Given a client enquiry, return ONLY a valid JSON object with these exact keys (no markdown, no extra text):
{
  "type": one of exactly ["New Client Enquiry", "Support Request", "Complaint", "Billing Query", "General Question"],
  "confidence": integer 0-100 (your certainty about the classification),
  "urgency": one of exactly ["High", "Medium", "Low"],
  "summary": one concise sentence summarising what the client needs,
  "routing": the team or role who should handle this (e.g. "Senior Consultant", "Support Team", "Accounts", "Client Relations Manager"),
  "actions": array of 2-4 short recommended action strings for the staff member,
  "response": a professional, warm 2-4 sentence suggested reply that acknowledges the enquiry and commits to follow-up without resolving the issue
}

Classification guide:
- New Client Enquiry: First contact, wants to engage, mentions buying/selling a business or getting advice
- Support Request: Existing client with a technical or service delivery problem
- Complaint: Explicit dissatisfaction, frustration, threats of escalation or bad reviews
- Billing Query: Invoice, payment, fee, or pricing question
- General Question: Low-stakes information request

If the enquiry is too vague to classify confidently, set confidence below 40, type to "General Question", and include an action to contact the client for clarification. Always return valid JSON only.`;

        // Run the Cloudflare Worker AI using the Llama-3 8B Instruct model
        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Analyse this client enquiry:\n\n' + text }
          ]
        });

        // The response from the AI
        const raw = response.response || '';
        // Extract JSON from potential markdown formatting
        const match = raw.match(/\{.*\}/s) || [raw];
        const clean = match[0].replace(/```json|```/g, '').trim();

        let result;
        try {
          result = JSON.parse(clean);
        } catch (e) {
          // Fallback parsing if strictly needed, or just return error
          throw new Error('AI did not return valid JSON: ' + clean);
        }

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
