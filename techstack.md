# Tech Stack

## AI Powered Ticket Management System

### Frontend
| Layer | Choice |
|---|---|
| Framework | **React** with **TypeScript** |
| Routing | **React Router** (client-side) |
| Styling | **Tailwind CSS** + **shadcn/ui** |

### Backend
| Layer | Choice |
|---|---|
| Runtime | **Node.js** with **TypeScript** |
| Framework | **Express** |
| Authentication | **Database sessions** (session stored in PostgreSQL) |
| ORM | **Prisma** |
| Database | **PostgreSQL** |

### AI
| Layer | Choice |
|---|---|
| LLM | **Claude API** (Anthropic) |
| Use cases | Ticket classification, AI summaries, suggested replies, auto-responses |
| Knowledge Base / RAG | **pgvector** (PostgreSQL extension) |

### Email
| Layer | Choice |
|---|---|
| Provider | **SendGrid** or **Mailgun** |
| Use cases | Receiving inbound support emails, sending responses to students |

### Infrastructure
| Layer | Choice |
|---|---|
| Containerisation | **Docker** |
| Deployment | **Railway** |

## Architecture Overview

```
Incoming Email
    → SendGrid / Mailgun inbound webhook
    → Express API creates ticket in PostgreSQL
    → Claude API classifies category, generates summary + suggested reply
    → Agent reviews in React dashboard
    → SendGrid / Mailgun delivers response email to student
```
