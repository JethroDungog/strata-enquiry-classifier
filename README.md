# Strata Enquiry Classifier

An AI-powered client enquiry triage tool built for Strata Management Consultants, running entirely on a Serverless Edge AI stack.

## What it does

Paste any client enquiry (email, web form, or freeform message) and the tool will:

- **Classify** the enquiry type: New Client, Support Request, Complaint, Billing Query, or General Question
- **Score confidence** (0–100%) so staff know how reliable the classification is
- **Assign urgency** (High / Medium / Low)
- **Suggest routing** — which team or role should handle it
- **Recommend actions** for the staff member to take
- **Draft a suggested response** — warm, professional, ready to send or adapt

## Tech Stack (Serverless Edge AI)

This project uses a lightning-fast, zero-dependency stack that runs at the network edge:

- **Frontend:** Vanilla HTML, CSS, and JavaScript (No React, Vue, or build steps)
- **Backend:** Cloudflare Workers (Serverless computing)
- **AI Engine:** Cloudflare Workers AI using the open-source **Meta Llama 3.1 (8B Instruct)** model.

## How to run it

This project is deployed live on Cloudflare Workers and can be accessed directly from any browser:

**Live Demo:** [https://strataenquiry.dungogjethro.workers.dev/](https://strataenquiry.dungogjethro.workers.dev/)

If you want to run it locally or edit the UI:
1. Clone this repository.
2. Open `index.html` in your browser.
3. The frontend is configured with CORS to securely call the live Cloudflare AI backend, meaning you can edit the UI locally and test it immediately without needing to run a local server.

## Design decisions

### Why Serverless Edge AI?
The goal was a production-ready application that is incredibly fast and costs $0 to scale. By using Cloudflare Workers, the code runs in data centers geographically closest to the user. Using Cloudflare's built-in AI bindings means we don't need to manage API keys for paid services like OpenAI or Anthropic. 

### Prompt design
To ensure the AI returns structured, predictable data instead of conversational text, I used the following system prompt:

```text
You are an AI triage assistant for Strata Management Consultants, a business advisory and brokerage firm. Your job is to classify incoming client enquiries and help staff respond efficiently.

Given a client enquiry, return ONLY a valid JSON object with these exact keys (no markdown, no extra text):
{
  "type": one of exactly ["New Client Enquiry", "Support Request", "Complaint", "Billing Query", "General Question"],
  "confidence": integer 0-100 (your certainty about the classification),
  "urgency": one of exactly ["High", "Medium", "Low"],
  "summary": one concise sentence summarising what the client needs,
  "routing": the team or role who should handle this,
  "actions": array of 2-4 short recommended action strings for the staff member,
  "response": a professional, warm 2-4 sentence suggested reply
}

Classification guide:
- New Client Enquiry: First contact, wants to engage, mentions buying/selling...
- Support Request: Existing client with a technical or service delivery problem
- Complaint: Explicit dissatisfaction, frustration, threats of escalation
- Billing Query: Invoice, payment, fee, or pricing question
- General Question: Low-stakes information request

If the enquiry is too vague to classify confidently, set confidence below 40, type to "General Question", and include an action to contact the client for clarification. Always return valid JSON only.
```

**Design Choices Explained:**
- **Context:** I explicitly tell it what the company does ("business advisory and brokerage firm") so its generated responses sound industry-appropriate.
- **Strict Output Constraints:** I provide an exact JSON schema and explicitly ban markdown formatting. This allows the frontend to `JSON.parse()` the result instantly.
- **Classification Guide:** I define the exact rules for each category so the AI isn't just guessing what a "Support Request" means in this context.
- **Vague Input Handling:** I gave it a specific fallback rule for vague inputs (lower confidence score to < 40 and default to General Question).

### Confidence scoring
Confidence is elicited directly from the model in the prompt. Low confidence (< 50%) turns the progress bar red, signalling to staff that they should double-check the classification.

### Error handling
- Network/API errors are caught and shown in a red error box
- JSON parse failures are caught and handled gracefully 
- Vague inputs are classified as "General Question" with low confidence and recommend a clarification call

## Automation potential

This tool could connect into a larger workflow:

1. **Email integration**: An inbound email webhook (e.g. via SendGrid or Postmark) triggers this worker logic server-side and populates a CRM automatically
2. **CRM routing**: Classification result routes the ticket to the right team queue in HubSpot, Salesforce, or similar
3. **Slack/Teams alerts**: High-urgency complaints trigger an immediate Slack notification to a manager
4. **Response drafts**: The suggested response auto-populates in the CRM reply window, saving staff 2–3 minutes per enquiry
