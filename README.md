# Strata Enquiry Classifier

An AI-powered client enquiry triage tool built for Strata Management Consultants.

## What it does

Paste any client enquiry (email, web form, or freeform message) and the tool will:

- **Classify** the enquiry type: New Client, Support Request, Complaint, Billing Query, or General Question
- **Score confidence** (0–100%) so staff know how reliable the classification is
- **Assign urgency** (High / Medium / Low)
- **Suggest routing** — which team or role should handle it
- **Recommend actions** for the staff member to take
- **Draft a suggested response** — warm, professional, ready to send or adapt

## How to run it

This is a single-file HTML app — no build step, no server, no dependencies.

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. The app calls the Anthropic Claude API directly from the browser
3. Paste an enquiry or click one of the example buttons and hit **Analyse Enquiry**

> **Note:** The app requires a valid Anthropic API key configured in the environment. In a production deployment, API calls would be proxied through a backend to keep the key secret.

## Design decisions

### Why a single HTML file?
The goal was a working prototype that any staff member can open immediately — no Node, no Python, no setup. In production this would be a proper backend + frontend.

### Prompt design
The system prompt tells the model exactly:
- What the company does (context)
- What the five categories are and how to distinguish them
- What to do with vague/nonsensical inputs (low confidence + request clarification)
- Output format (strict JSON, no markdown fences)

This gives consistent, parseable output rather than free-form text.

### Confidence scoring
Confidence is elicited directly from the model in the prompt. Low confidence (< 50%) turns the progress bar red, signalling to staff that they should double-check the classification.

### Error handling
- Network/API errors are caught and shown in a red error box
- JSON parse failures are caught (the model is instructed not to wrap in markdown, but the code strips fences anyway)
- Vague inputs are handled gracefully — the model is instructed to classify as "General Question" with low confidence and recommend a clarification call

## Automation potential

This tool could connect into a larger workflow:

1. **Email integration**: An inbound email webhook (e.g. via SendGrid, Postmark, or Zapier) triggers this logic server-side and populates a CRM automatically
2. **CRM routing**: Classification result routes the ticket to the right team queue in HubSpot, Salesforce, or similar
3. **Slack/Teams alerts**: High-urgency complaints trigger an immediate Slack notification to a manager
4. **Response drafts**: The suggested response auto-populates in the CRM reply window, saving staff 2–3 minutes per enquiry

## Tech used

- HTML / CSS / Vanilla JavaScript (no frameworks)
- [Anthropic Claude API](https://docs.anthropic.com) — `claude-sonnet-4-20250514`
- Zero external dependencies
