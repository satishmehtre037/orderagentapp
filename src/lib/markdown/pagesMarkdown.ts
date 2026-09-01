/**
 * Static markdown documents served for Accept: text/markdown content negotiation
 * as specified by acceptmarkdown.com.
 */

export const MARKDOWN_PAGES: Record<string, string> = {
  '/': `# Agento AI — 24/7 Autonomous WhatsApp AI Staff & Business Operating System

> Agento AI by WebCore Studio is an autonomous multi-tenant AI business operating system that deploys intelligent 24/7 AI agents across WhatsApp, Voice, and Web.

## Core Capabilities

### 1. Hospital & Clinic OPD Automation
- 24-hour and 2-hour automated WhatsApp appointment reminders with interactive 1/2/3 confirmation actions (1=Confirm, 2=Reschedule, 3=Cancel).
- Diagnostic lab PDF report delivery with OCR extraction and patient-friendly AI summaries.
- Real-time doctor schedule discovery and OPD slot booking.
- Post-consultation 5-star feedback surveys with automatic Google Review routing.

### 2. CA Firm & Tax Consultancy OS
- Automated GST, TDS, and ITR filing countdown deadline tracking.
- Client document chasing (PAN, Aadhaar, Bank Statements, Invoices) with OCR classification.
- Instant quote generation and payment reminder recovery.
- Hot lead qualification and Telegram/WhatsApp partner alerts.

### 3. E-Commerce & Retail Order Engine
- Conversational product search and catalog browsing on WhatsApp.
- Dynamic cart management with instant Razorpay UPI payment links.
- Automated payment verification and live order dispatch notifications.

## Machine-Readable Resources
- [OpenAPI 3.1 Spec](https://orderagentapp.webcorestudio.dev/openapi.json)
- [Developer Documentation](https://orderagentapp.webcorestudio.dev/api-docs)
- [LLMs Directory](https://orderagentapp.webcorestudio.dev/llms.txt)
- [Full LLM Context](https://orderagentapp.webcorestudio.dev/llms-full.txt)
- [XML Sitemap](https://orderagentapp.webcorestudio.dev/sitemap.xml)
- [Agent Protocol Spec](https://orderagentapp.webcorestudio.dev/.well-known/agent.json)

## Company Information
- Organization: WebCore Studio
- Brand: Agento AI
- Support: support@webcorestudios.in
- Telephone: +91 87798 41346
- Address: WebCore Studio Tech Hub, Mumbai, Maharashtra 400001, India
- Website: https://orderagentapp.webcorestudio.dev
`,

  '/about': `# About Agento AI & WebCore Studio

Agento AI was created by WebCore Studio to bridge the gap between advanced enterprise AI models and practical daily business operations. We build 24/7 autonomous AI assistants that manage WhatsApp conversations, clinic appointments, tax compliance reminders, and e-commerce orders.

## Mission
To provide every healthcare provider, accounting professional, and retail merchant with an enterprise-grade AI staff member who never sleeps and speaks their customers' native language.

## Technology Stack
- **AI Core**: Claude 3.5 Sonnet / Groq Llama 3 for low-latency reasoning.
- **Voice Intelligence**: OpenAI Whisper for regional voice note transcription.
- **Messaging Pipeline**: Official Meta WhatsApp Cloud API with HMAC-SHA256 signature verification.
- **Data Security**: Supabase PostgreSQL with strict multi-tenant Row-Level Security (RLS).

## Contact & Corporate Identity
- **Legal Entity**: WebCore Studio
- **Platform**: Agento AI Business OS
- **Email**: support@webcorestudios.in
- **Phone**: +91 87798 41346
- **Headquarters**: Mumbai, Maharashtra 400001, India
- **URL**: https://orderagentapp.webcorestudio.dev/about
`,

  '/contact': `# Contact & Support — Agento AI by WebCore Studio

We are here to assist with subscription management, WhatsApp Business API onboarding, and custom AI agent integrations.

## Contact Channels
- **Email Support**: support@webcorestudios.in (24–48h response window)
- **Direct Phone / WhatsApp**: +91 87798 41346
- **Operational Hours**: 
  - Automated AI Assistant: 24/7/365
  - Executive Helpdesk: Monday – Saturday, 9:00 AM – 7:00 PM IST
- **Physical Headquarters**: WebCore Studio Tech Hub, Mumbai, Maharashtra 400001, India
- **Web Portal**: https://orderagentapp.webcorestudio.dev/contact
`,

  '/privacy': `# Privacy Policy & Data Protection — Agento AI

**Effective Date:** 2026-09-01  
**Entity:** WebCore Studio ("Agento AI")

## Principles
1. **Tenant Isolation**: Every business tenant's conversations, patients, and financial invoices are isolated via cryptographic UUIDs and PostgreSQL Row-Level Security.
2. **Data Usage**: Customer data processed through WhatsApp is used strictly to fulfill the requested business task (booking appointments, chasing tax documents, processing orders). We never sell user data.
3. **Encryption**: All payloads in transit use TLS 1.3, and data at rest is encrypted with AES-256.
4. **Opt-Out Compliance**: Customers can instantly opt out of automated messages by sending "STOP", "UNSUBSCRIBE", or "CANCEL".

For data access or erasure requests, contact **support@webcorestudios.in**.
`,

  '/terms': `# Terms of Service — Agento AI

**Effective Date:** 2026-09-01  
**Provider:** WebCore Studio

## Terms Overview
By accessing or using Agento AI, you agree to comply with these terms, WhatsApp Cloud API policies, and Indian Information Technology laws.

1. **Subscription & Billing**: Subscriptions are billed on a monthly or annual basis via Razorpay.
2. **Service Availability**: We target 99.9% uptime for AI message processing and webhook pipelines.
3. **Acceptable Use**: You may not use Agento AI for spam, unsolicited cold bulk messaging, or deceptive impersonation.

Contact: support@webcorestudios.in
`,

  '/api-docs': `# Agento AI — REST API & Developer Reference

Canonical URL: https://orderagentapp.webcorestudio.dev/api-docs  
OpenAPI Specification: https://orderagentapp.webcorestudio.dev/openapi.json

## Authentication
Include \`Authorization: Bearer <TOKEN>\` or \`x-business-id: <UUID>\` in your request headers.

## Endpoints

### 1. Inbound Webhook
\`POST /api/webhook\`  
Meta WhatsApp Cloud API webhook receiver. Requires valid \`x-hub-signature-256\`.

### 2. Hospital Appointments
- \`GET /api/hospital/appointments?business_id={id}\`: List appointments.
- \`POST /api/hospital/appointments\`: Create consultation booking.
- \`PUT /api/hospital/appointments\`: Update status (\`confirmed\`, \`rescheduled\`, \`completed\`, \`cancelled\`).

### 3. Lab Reports
- \`GET /api/hospital/reports?business_id={id}\`: List diagnostic reports.
- \`POST /api/hospital/reports\`: Upload PDF with AI summary and dispatch WhatsApp token.

### 4. Background Automation Triggers
\`POST /api/hospital/cron/trigger/{jobName}\`  
Jobs: \`reminders\`, \`feedback_surveys\`, \`missed_followups\`, \`all\`.
`,

  '/cli': `# Agento AI CLI — Command Line Tool Reference

Official CLI tool for Agento AI by WebCore Studio. Automate WhatsApp business operations, appointments, and background cron scans from your terminal.

## Quick Execution
\`\`\`bash
# Check production health & status
npx @webcorestudio/agento-cli status

# Query OPD appointments
npx @webcorestudio/agento-cli appointments list --business-id <UUID>

# Trigger background automation scanners
npx @webcorestudio/agento-cli cron trigger all --business-id <UUID>
\`\`\`

## Commands
- \`status\`, \`health\`: System connectivity and response latency.
- \`appointments list\`: Fetch active consultations for a tenant.
- \`cron trigger <job>\`: Run background scans (\`reminders\`, \`feedback_surveys\`, \`all\`).
- \`version\`: Print CLI package version.

## Documentation
- Web Portal: https://orderagentapp.webcorestudio.dev/cli
- OpenAPI Spec: https://orderagentapp.webcorestudio.dev/openapi.json
`,

  '/developers': `# Agento AI by WebCore Studio — Developer Portal & API Directory

Official Developer Portal for Agento AI by WebCore Studio. Access REST APIs, OpenAPI 3.1 specification, Authentication guides, MCP Server, and CLI tools.

## Developer Resources
- [REST API Reference](https://orderagentapp.webcorestudio.dev/api-docs)
- [OpenAPI 3.1 Specification](https://orderagentapp.webcorestudio.dev/openapi.json)
- [Authentication Documentation](https://orderagentapp.webcorestudio.dev/auth-docs)
- [Model Context Protocol (MCP) Server](https://orderagentapp.webcorestudio.dev/mcp)
- [CLI Tool Reference](https://orderagentapp.webcorestudio.dev/cli)
- [API Deprecation & Lifecycle Policy](https://orderagentapp.webcorestudio.dev/deprecation)
- [LLMs Machine-Readable Directory](https://orderagentapp.webcorestudio.dev/llms.txt)
`,

  '/auth-docs': `# Agento AI by WebCore Studio — Authentication Documentation

Every programmatic request to Agento AI is authenticated using Bearer tokens, x-business-id tenant headers, or HMAC-SHA256 signatures.

## Authentication Headers
- Bearer Token: \`Authorization: Bearer <TOKEN>\`
- Tenant UUID Header: \`x-business-id: <UUID>\`
- Inbound Webhook Signature: \`x-hub-signature-256: sha256=<HASH>\`
- Cron Runner Secret: \`x-cron-secret: <SECRET>\`
`,

  '/mcp': `# Agento AI by WebCore Studio — Model Context Protocol (MCP) Server

Connect Claude Desktop, Cursor, and AI agents directly to Agento AI tools via the Model Context Protocol.

## Configuration
\`\`\`json
{
  "mcpServers": {
    "agento-ai": {
      "command": "npx",
      "args": ["-y", "@webcorestudio/agento-cli", "mcp"],
      "env": {
        "AGENTO_API_URL": "https://orderagentapp.webcorestudio.dev",
        "AGENTO_BUSINESS_ID": "<YOUR_BUSINESS_UUID>"
      }
    }
  }
}
\`\`\`
`,

  '/deprecation': `# Agento AI API Versioning & 180-Day Deprecation Policy

WebCore Studio guarantees a minimum of 180 days advance notice before making breaking changes to the Agento AI REST API.

## Headers
- \`X-API-Version: 2026-09-01\`
- \`Link: <https://orderagentapp.webcorestudio.dev/deprecation>; rel="deprecation"\`
- \`Sunset: Wed, 01 Sep 2027 00:00:00 GMT\`
`,

  '/brand': `# Agento AI by WebCore Studio — Brand Identity & Corporate NAP

Official corporate identity, verified Name-Address-Phone (NAP), and media kit for Agento AI by WebCore Studio.

## Verified NAP
- Legal Entity: WebCore Studio
- Brand Name: Agento AI by WebCore Studio
- Canonical URL: https://orderagentapp.webcorestudio.dev
- Phone / WhatsApp: +91 87798 41346
- Email: support@webcorestudios.in
- Headquarters: WebCore Studio Tech Hub, Mumbai, Maharashtra 400001, India
`,
};

export const NOT_FOUND_MARKDOWN = `# 404 — Resource Not Found

The requested URL does not exist on Agento AI (orderagentapp.webcorestudio.dev).

## Recovery Directory
- [Homepage](https://orderagentapp.webcorestudio.dev/)
- [LLMs Directory](https://orderagentapp.webcorestudio.dev/llms.txt)
- [API Documentation](https://orderagentapp.webcorestudio.dev/api-docs)
- [OpenAPI Specification](https://orderagentapp.webcorestudio.dev/openapi.json)
- [XML Sitemap](https://orderagentapp.webcorestudio.dev/sitemap.xml)
- [About Us](https://orderagentapp.webcorestudio.dev/about)
- [Contact Support](https://orderagentapp.webcorestudio.dev/contact)
`;
