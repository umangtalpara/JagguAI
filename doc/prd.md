# PRD – JaguAI(SaaSBot AI)

**Version:** 1.0 (MVP)

---

# Product Name

**Jagu AI**

**Tagline**

Deploy an AI Chat & Voice Assistant on any website in under 5 minutes.

---

# 1. Product Vision

JaguAI is a multi-tenant AI platform that enables businesses to create their own AI-powered chat and voice assistant without writing code.

Businesses simply:

1. Sign up
2. Add their company information
3. Upload documents or crawl their website
4. Customize the widget
5. Copy one JavaScript snippet
6. Paste it into their website

The AI then answers visitor questions based only on the customer's knowledge base.

---

# 2. Problem Statement

Many businesses lose potential customers because:

* Visitors leave without finding answers
* Customer support is unavailable 24/7
* FAQ pages are difficult to maintain
* Live chat requires human agents
* Existing AI chatbot solutions are expensive or difficult to configure

JaguAI solves these problems by providing a customizable AI assistant trained on each business's own content.

---

# 3. Goals

### Business Goals

* Launch MVP quickly
* Acquire first paying customers
* Support multiple tenants
* Scale to thousands of businesses

### Product Goals

* 5-minute setup
* Accurate AI responses
* Voice and chat support
* Easy website integration
* Low operational cost

---

# 4. Target Users

### Small Businesses

Need an AI support assistant.

### SaaS Companies

Need automated customer support.

### Agencies

Manage AI assistants for multiple clients.

### E-commerce Stores

Answer product and shipping questions.

### Service Companies

Generate leads and answer service inquiries.

---

# 5. User Flow

```text
Sign Up
↓

Create Workspace
↓

Add Company Information
↓

Upload Documents / Crawl Website
↓

Generate Embeddings
↓

Customize Widget
↓

Copy Script
↓

Paste on Website
↓

Visitors Chat with AI
↓

Dashboard Analytics
```

---

# 6. MVP Features

## Authentication

* Email login
* Google login (Future)
* JWT Authentication

---

## Workspace

Each customer receives:

* Workspace
* API Key
* Knowledge Base
* Widget Settings
* Conversations
* Analytics

---

## Knowledge Base

Supported Sources

* Website URL
* PDF
* DOCX
* TXT
* Markdown
* Manual FAQ
* Rich Text

Future

* Notion
* Google Docs
* Confluence

---

## Website Crawler

Features

* Crawl website
* Sitemap support
* Robots.txt support
* Incremental crawling
* Scheduled re-indexing

---

## Document Processing

* Upload
* Chunk
* Clean text
* Generate embeddings
* Store in Qdrant

---

## AI Chat

* Streaming responses
* Markdown
* References (optional)
* Suggested questions
* Conversation history

---

## AI Voice

* Speech-to-Text
* Voice response
* Continuous conversation
* Multi-language ready

---

## Widget

Customer receives

```html
<script
src="https://cdn.jagu.ai/widget.js"
data-api-key="workspace_key">
</script>
```

Customization

* Color
* Logo
* Avatar
* Greeting
* Theme
* Position
* Voice On/Off

---

## Dashboard

* Conversations
* Visitors
* Leads
* Analytics
* Knowledge Base
* Widget Settings

---

# 7. Functional Requirements

## Authentication

* Register
* Login
* Logout
* Forgot Password
* JWT
* Refresh Token

---

## Workspace

* Create
* Update
* Delete
* API Keys
* Branding

---

## Knowledge Base

* Upload
* Delete
* Update
* Re-index
* Search

---

## Chat

* Send Message
* Stream Response
* Save Conversation

---

## Voice

* Upload Audio
* Convert Speech
* Generate AI Response
* Convert Response to Audio
* Stream Audio

---

## Analytics

Track

* Messages
* Voice Sessions
* Visitors
* Response Time
* Failed Answers
* Popular Questions

---

# 8. Non-Functional Requirements

* Multi-tenant
* Secure
* Scalable
* Responsive
* High availability
* Fast search
* Horizontal scaling

---

# 9. Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* TanStack Query
* React Router

---

## Backend

* NestJS
* MongoDB
* JWT
* WebSocket

---

## AI

LLM

* Qwen 3

Speech-to-Text

* Deepgram

Text-to-Speech

* Kokoro

Embeddings

* BAAI bge-base-en-v1.5

Vector Database

* Qdrant Cloud

---

## Storage

* Amazon S3

Store

* PDFs
* DOCX
* Images
* Audio
* Website snapshots
* Knowledge files

---

## Queue

BullMQ + Redis

Jobs

* Crawl Website
* PDF Processing
* Generate Embeddings
* Qdrant Indexing
* Voice Processing
* Scheduled Re-index
* Email Notifications

---

## Cache

Redis

Use Cases

* Sessions
* Cache
* Rate Limiting
* Queue
* Conversation State

---

# 10. System Architecture

```text
Customer Website
       │
       ▼
Widget.js
       │
       ▼
API Gateway (NestJS)
       │
 ┌─────┼──────────────┐
 │     │              │
 ▼     ▼              ▼
Chat Voice      Dashboard
 │     │
 └─────┼──────────────┐
       ▼
    RAG Service
       │
 ┌─────┼─────────────┐
 ▼     ▼             ▼
Mongo Qdrant      Redis
 │                 │
 └──────┬──────────┘
        ▼
      BullMQ
        │
 ┌──────┼──────────────┐
 ▼      ▼              ▼
Crawler Embeddings     S3
        │
        ▼
      Qwen 3
```

---

# 11. RAG Pipeline

```text
Website
PDF
FAQ
↓

Chunking

↓

Embedding

↓

Qdrant

↓

Similarity Search

↓

Top Results

↓

Qwen 3

↓

Final Response
```

---

# 12. Voice Pipeline

```text
Microphone

↓

Deepgram STT

↓

User Text

↓

RAG Search

↓

Qwen 3

↓

Response Text

↓

Kokoro TTS

↓

Speaker
```

---

# 13. MongoDB Collections

Users

Workspaces

ApiKeys

KnowledgeFiles

KnowledgeChunks

Conversations

Messages

WidgetSettings

Analytics

Jobs

VoiceSessions

AuditLogs

---

# 14. Qdrant Collections

workspace_id

chunk_id

embedding

metadata

source

document_id

---

# 15. S3 Structure

```
workspace-id/

documents/

audio/

images/

crawl/

exports/
```

---

# 16. API Modules

Auth Module

Workspace Module

Knowledge Module

Crawler Module

Embedding Module

Chat Module

Voice Module

Analytics Module

Widget Module

Storage Module

Queue Module

Admin Module

---

# 17. Security

JWT Authentication

Workspace Isolation

Encrypted API Keys

Rate Limiting

HTTPS

Prompt Injection Protection

Input Validation

CORS

Audit Logs

---

# 18. Future Features

* Live Human Handoff
* WhatsApp Integration
* Slack Integration
* Microsoft Teams
* HubSpot CRM
* Salesforce
* Stripe Billing
* Razorpay Billing
* White-label Domains
* Multiple LLM Providers
* Multiple Embedding Providers
* Multiple Voice Providers
* AI Agent Workflows
* Calendar Booking
* Email Automation
* Lead Qualification
* AI Analytics Dashboard

---

# 19. MVP Milestones

### Phase 1

* Authentication
* Workspace
* Website Crawler
* Knowledge Base
* Embeddings
* Qdrant Integration
* Chat API
* Widget
* Dashboard

### Phase 2

* Voice
* Analytics
* Branding
* Lead Capture

### Phase 3

* Billing
* Integrations
* White Label
* Team Management

---

# 20. Success Metrics

* Widget setup under 5 minutes
* AI response time under 2 seconds (excluding LLM latency)
* 90%+ answer accuracy on indexed knowledge
* 99.9% service availability target
* First paying customer within 30 days of launch
* Support for 1,000+ workspaces on the initial architecture

---

# 21. Out of Scope (MVP)

* Mobile applications
* Video avatar assistants
* CRM integrations
* WhatsApp bot
* Multi-agent orchestration
* Custom model training
* Enterprise SSO
* Marketplace integrations

These features will be considered after validating product-market fit.
