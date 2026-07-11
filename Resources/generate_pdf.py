#!/usr/bin/env python3
"""
AI Architecture Builder - Compact Professional SDD (5-6 pages)
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.colors import black, HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Preformatted
)
import os

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AI Architecture Builder.pdf")

def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(name='Title1', fontName='Helvetica-Bold', fontSize=20, leading=24, alignment=TA_CENTER, spaceAfter=4, textColor=black))
    s.add(ParagraphStyle(name='Sub1', fontName='Helvetica', fontSize=11, leading=14, alignment=TA_CENTER, spaceAfter=2, textColor=HexColor('#555555')))
    s.add(ParagraphStyle(name='H1', fontName='Helvetica-Bold', fontSize=15, leading=20, spaceBefore=14, spaceAfter=6, textColor=black))
    s.add(ParagraphStyle(name='H2', fontName='Helvetica-Bold', fontSize=12, leading=16, spaceBefore=10, spaceAfter=4, textColor=black))
    s.add(ParagraphStyle(name='B', fontName='Helvetica', fontSize=9.5, leading=13, spaceBefore=1, spaceAfter=4, alignment=TA_JUSTIFY, textColor=black))
    s.add(ParagraphStyle(name='Pt', fontName='Helvetica', fontSize=9.5, leading=13, leftIndent=16, spaceBefore=1, spaceAfter=1, textColor=black))
    s.add(ParagraphStyle(name='Pt2', fontName='Helvetica', fontSize=9.5, leading=13, leftIndent=32, spaceBefore=0, spaceAfter=1, textColor=black))
    s.add(ParagraphStyle(name='CodeBlock', fontName='Courier', fontSize=8, leading=10.5, leftIndent=16, spaceBefore=4, spaceAfter=4, textColor=black, backColor=HexColor('#F5F5F5')))
    s.add(ParagraphStyle(name='Arrow', fontName='Helvetica', fontSize=9, leading=10, leftIndent=44, spaceBefore=0, spaceAfter=0, textColor=HexColor('#888888')))
    s.add(ParagraphStyle(name='TH', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=black))
    s.add(ParagraphStyle(name='TD', fontName='Helvetica', fontSize=8.5, leading=11, textColor=black))
    return s

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(HexColor('#AAAAAA'))
    canvas.drawCentredString(letter[0]/2, 0.4*inch, f"AI Architecture Builder  •  Software Design Document  •  Page {doc.page}")
    canvas.setStrokeColor(HexColor('#DDDDDD'))
    canvas.setLineWidth(0.4)
    canvas.line(0.6*inch, 0.55*inch, letter[0]-0.6*inch, 0.55*inch)
    canvas.restoreState()

def hr():
    return HRFlowable(width="100%", thickness=0.8, color=black, spaceBefore=4, spaceAfter=6)

def thinhr():
    return HRFlowable(width="100%", thickness=0.3, color=HexColor('#CCCCCC'), spaceBefore=4, spaceAfter=4)

def pt(text, s):
    return Paragraph(f"● {text}", s['Pt'])

def pt2(text, s):
    return Paragraph(f"○ {text}", s['Pt2'])

def tbl(headers, rows, widths=None):
    data = [headers] + rows
    if not widths:
        widths = [6.5*inch/len(headers)] * len(headers)
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('LEADING', (0,0), (-1,-1), 11),
        ('BACKGROUND', (0,0), (-1,0), HexColor('#EEEEEE')),
        ('GRID', (0,0), (-1,-1), 0.4, HexColor('#999999')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    return t

def code_block(text, s):
    """Render a folder structure block with monospace font."""
    lines = text.strip().split('\n')
    elements = []
    for line in lines:
        elements.append(Paragraph(line.replace(' ', '&nbsp;').replace('<', '&lt;').replace('>', '&gt;'), s['CodeBlock']))
    return elements

def build():
    doc = SimpleDocTemplate(OUTPUT, pagesize=letter, topMargin=0.6*inch, bottomMargin=0.65*inch, leftMargin=0.65*inch, rightMargin=0.65*inch)
    S = styles()
    story = []

    # ===== TITLE (compact - no separate page) =====
    story.append(Spacer(1, 10))
    story.append(Paragraph("AI Architecture Builder", S['Title1']))
    story.append(Paragraph("Software Design Document  •  Version 1.0  •  July 2026", S['Sub1']))
    story.append(Spacer(1, 6))
    story.append(hr())

    # ===== PROJECT OVERVIEW, OBJECTIVES, GOALS =====
    story.append(Paragraph("Project Overview", S['H1']))
    story.append(Paragraph(
        "The AI Architecture Builder is an enterprise platform that uses a multi-agent AI system to automatically generate complete cloud architectures from requirement documents. Users upload project requirements, and the system produces system diagrams, database schemas, API designs, Terraform scripts, security validations, and cost estimates — all without manual architecture work.",
        S['B']
    ))

    story.append(Paragraph("Objectives", S['H2']))
    story.append(pt("Automate end-to-end cloud architecture generation from requirement documents.", S))
    story.append(pt("Use 16 specialized AI agents that collaborate to produce production-ready output.", S))
    story.append(pt("Generate deployable Terraform code, database schemas, and API specifications.", S))
    story.append(pt("Provide AI-powered architecture review with quality scoring.", S))
    story.append(pt("Support interactive refinement through AI chat.", S))

    story.append(Paragraph("Goals", S['H2']))
    story.append(pt("<b>Business:</b> Reduce architecture design time from weeks to hours. Standardize architecture practices across teams.", S))
    story.append(pt("<b>Technical:</b> Scalable multi-agent orchestration. Cloud-agnostic (AWS, Azure, GCP). Extensible agent framework.", S))
    story.append(pt("<b>AI:</b> Context-aware decisions using RAG. Explainable recommendations. Reliable validation with low false positives.", S))

    story.append(Paragraph("Who Uses It", S['H2']))
    story.append(pt("<b>Architects</b> — accelerate design and validate decisions.", S))
    story.append(pt("<b>Dev Teams</b> — generate architectures without waiting for architects.", S))
    story.append(pt("<b>DevOps</b> — receive production-ready Terraform and pipelines.", S))
    story.append(pt("<b>Managers</b> — review architectures with AI quality scores.", S))

    story.append(Spacer(1, 6))
    story.append(hr())

    # ===== PHASE 1: PROJECT SETUP =====
    story.append(Paragraph("Phase 1 — Project Initialization &amp; Authentication", S['H1']))
    story.append(Paragraph(
        "Set up the monorepo project structure, configure the development environment, implement user authentication with JWT, create the database schema with migrations, and build the basic frontend shell with login, registration, and an empty dashboard. This is the foundation — nothing else works without auth and database.",
        S['B']
    ))

    story.append(Paragraph("What to do", S['H2']))
    story.append(pt("Initialize monorepo with frontend (React + Vite + TypeScript) and backend (Node.js + Express + TypeScript) packages.", S))
    story.append(pt("Set up PostgreSQL database with migration tool (Prisma or Knex).", S))
    story.append(pt("Implement user registration, login, logout, password reset.", S))
    story.append(pt("JWT access tokens (15 min expiry) + refresh tokens (7 day) with rotation.", S))
    story.append(pt("Build frontend shell: login page, register page, sidebar + header layout, empty dashboard.", S))
    story.append(pt("Set up audit logging for all auth events.", S))
    story.append(pt("Configure ESLint, Prettier, Jest, CI/CD pipeline.", S))

    story.append(Paragraph("Folder Structure", S['H2']))
    folder1 = [
        "ai-architecture-agent/",
        "├── frontend/",
        "│   ├── src/",
        "│   │   ├── components/         # Reusable UI components",
        "│   │   │   ├── common/         # Button, Input, Modal, Loader",
        "│   │   │   └── layout/         # Sidebar, Header, AppLayout",
        "│   │   ├── pages/",
        "│   │   │   ├── auth/           # LoginPage, RegisterPage, ForgotPassword",
        "│   │   │   └── dashboard/      # DashboardPage",
        "│   │   ├── services/           # API client (axios instance, auth service)",
        "│   │   ├── store/              # State management (Zustand or Redux)",
        "│   │   ├── hooks/              # useAuth, useApi custom hooks",
        "│   │   ├── utils/              # Helpers, validators, formatters",
        "│   │   ├── types/              # TypeScript interfaces",
        "│   │   ├── styles/             # Global CSS, design tokens",
        "│   │   ├── routes/             # Route config with protected routes",
        "│   │   ├── App.tsx             # Root component",
        "│   │   └── main.tsx            # Entry point",
        "│   ├── package.json",
        "│   └── vite.config.ts",
        "├── backend/",
        "│   ├── src/",
        "│   │   ├── config/             # DB, auth, app config files",
        "│   │   ├── controllers/        # auth.controller.ts",
        "│   │   ├── services/           # auth.service.ts, audit.service.ts",
        "│   │   ├── models/             # user.model.ts, organization.model.ts",
        "│   │   ├── middleware/          # auth.middleware.ts, error-handler.ts",
        "│   │   ├── routes/             # auth.routes.ts",
        "│   │   ├── migrations/         # 001_create_users.ts, 002_create_orgs.ts",
        "│   │   ├── utils/              # jwt.ts, password.ts, logger.ts",
        "│   │   ├── types/              # TypeScript interfaces",
        "│   │   └── app.ts              # Express app entry point",
        "│   └── package.json",
        "├── shared/                      # Shared types between frontend/backend",
        "├── docker-compose.yml           # PostgreSQL + Redis for local dev",
        "├── .github/workflows/           # CI/CD pipelines",
        "└── package.json                 # Root workspace config",
    ]
    for line in folder1:
        story.append(Paragraph(line.replace(' ', '&nbsp;').replace('<', '&lt;'), S['CodeBlock']))

    story.append(Spacer(1, 6))
    story.append(hr())

    # ===== PHASE 2: BACKEND =====
    story.append(Paragraph("Phase 2 — Backend API Development", S['H1']))
    story.append(Paragraph(
        "Build all backend REST APIs for project management, document upload and processing, architecture generation triggers, version management, review handling, deployment management, and chat. Each API module has a controller (handles request/response), a service (business logic), and a model (database). WebSocket support for real-time progress updates.",
        S['B']
    ))

    story.append(Paragraph("What to do", S['H2']))
    story.append(pt("Build Project CRUD APIs — create, list, get, update, archive projects.", S))
    story.append(pt("Build Document Upload API — multipart upload, validate format (PDF/DOCX/TXT/MD), store in S3, trigger processing.", S))
    story.append(pt("Build Architecture APIs — trigger generation, get current architecture, get database schema, get API specs.", S))
    story.append(pt("Build Version APIs — list versions, get version, compare two versions, rollback.", S))
    story.append(pt("Build Review APIs — request review, list reviews, get review details, respond to findings.", S))
    story.append(pt("Build Deployment APIs — initiate, approve, list, rollback deployments.", S))
    story.append(pt("Build Chat APIs — create conversation, send message, get message history.", S))
    story.append(pt("Build Cloud Mapping and Terraform APIs — get mappings, get/download/validate Terraform.", S))
    story.append(pt("Set up WebSocket server for real-time generation progress and deployment status.", S))
    story.append(pt("Implement RBAC middleware (Viewer, Editor, Approver, Admin roles).", S))
    story.append(pt("Add rate limiting, input validation, and error handling middleware.", S))

    story.append(Paragraph("API Reference", S['H2']))
    api_data = [
        ['POST /api/auth/register', 'Create user account'],
        ['POST /api/auth/login', 'Login, returns JWT tokens'],
        ['POST /api/auth/refresh', 'Refresh access token'],
        ['POST /api/auth/logout', 'Invalidate session'],
        ['POST /api/projects', 'Create new project'],
        ['GET /api/projects', 'List user projects'],
        ['GET /api/projects/:id', 'Get project details'],
        ['PUT /api/projects/:id', 'Update project settings'],
        ['DELETE /api/projects/:id', 'Archive project'],
        ['POST /api/projects/:id/documents', 'Upload requirement document'],
        ['GET /api/projects/:id/documents', 'List project documents'],
        ['POST /api/projects/:id/generate', 'Start architecture generation'],
        ['GET /api/projects/:id/architecture', 'Get current architecture'],
        ['GET /api/projects/:id/architecture/database', 'Get database schema'],
        ['GET /api/projects/:id/architecture/apis', 'Get API specification'],
        ['GET /api/projects/:id/cloud-mapping', 'Get cloud service mapping'],
        ['GET /api/projects/:id/terraform', 'Get Terraform code'],
        ['GET /api/projects/:id/terraform/download', 'Download Terraform as zip'],
        ['POST /api/projects/:id/terraform/validate', 'Validate Terraform syntax'],
        ['POST /api/projects/:id/reviews', 'Request AI review'],
        ['GET /api/projects/:id/reviews/:rId', 'Get review with findings'],
        ['PUT /api/projects/:id/reviews/:rId/findings/:fId', 'Accept/reject finding'],
        ['GET /api/projects/:id/versions', 'List architecture versions'],
        ['GET /api/projects/:id/versions/compare', 'Compare two versions'],
        ['POST /api/projects/:id/versions/:vId/rollback', 'Rollback to version'],
        ['POST /api/projects/:id/deployments', 'Initiate deployment'],
        ['POST /api/projects/:id/deployments/:dId/approve', 'Approve deployment'],
        ['POST /api/projects/:id/deployments/:dId/rollback', 'Rollback deployment'],
        ['POST /api/projects/:id/conversations', 'Start chat conversation'],
        ['POST /api/projects/:id/conversations/:cId/messages', 'Send chat message'],
        ['GET /api/projects/:id/conversations/:cId/messages', 'Get chat history'],
        ['GET /api/projects/:id/diagrams/:type', 'Get diagram (system-context, component, deployment, sequence, data-flow)'],
        ['GET /api/projects/:id/workflow-status', 'Get generation progress'],
    ]
    api_table = tbl(
        ['Endpoint', 'Purpose'],
        api_data,
        widths=[3.2*inch, 3.3*inch]
    )
    story.append(api_table)

    story.append(Paragraph("Backend Folder Structure (Phase 2 additions)", S['H2']))
    folder2 = [
        "backend/src/",
        "├── controllers/",
        "│   ├── auth.controller.ts        # Login, register, token refresh",
        "│   ├── project.controller.ts      # Project CRUD operations",
        "│   ├── document.controller.ts     # File upload & processing",
        "│   ├── architecture.controller.ts # Architecture generation & retrieval",
        "│   ├── terraform.controller.ts    # Terraform code & validation",
        "│   ├── review.controller.ts       # AI review & findings",
        "│   ├── version.controller.ts      # Version history & comparison",
        "│   ├── deployment.controller.ts   # Deploy, approve, rollback",
        "│   ├── chat.controller.ts         # Conversations & messages",
        "│   ├── diagram.controller.ts      # Diagram generation & export",
        "│   └── cloud.controller.ts        # Cloud service catalog",
        "├── services/",
        "│   ├── auth.service.ts            # JWT, password hashing, sessions",
        "│   ├── project.service.ts         # Project business logic",
        "│   ├── document.service.ts        # File parsing, text extraction",
        "│   ├── architecture.service.ts    # Architecture storage & manipulation",
        "│   ├── terraform.service.ts       # Terraform code management",
        "│   ├── review.service.ts          # Review triggers & findings tracking",
        "│   ├── version.service.ts         # Snapshots, diffs, rollback",
        "│   ├── deployment.service.ts      # Terraform execution, status",
        "│   ├── chat.service.ts            # Message routing to agents",
        "│   ├── notification.service.ts    # WebSocket & email notifications",
        "│   └── audit.service.ts           # Immutable audit log recording",
        "├── models/",
        "│   ├── user.model.ts              # Users table",
        "│   ├── organization.model.ts      # Organizations table",
        "│   ├── project.model.ts           # Projects table",
        "│   ├── document.model.ts          # Uploaded documents table",
        "│   ├── requirement.model.ts       # Extracted requirements table",
        "│   ├── architecture-version.model.ts  # Version snapshots table",
        "│   ├── review.model.ts            # Review results table",
        "│   ├── review-finding.model.ts    # Individual findings table",
        "│   ├── deployment.model.ts        # Deployment records table",
        "│   ├── conversation.model.ts      # Chat conversations table",
        "│   ├── message.model.ts           # Chat messages table",
        "│   ├── knowledge.model.ts         # RAG knowledge base table",
        "│   ├── agent-execution.model.ts   # Agent run logs table",
        "│   └── audit-log.model.ts         # Audit trail table",
        "├── middleware/",
        "│   ├── auth.middleware.ts          # JWT verification",
        "│   ├── rbac.middleware.ts          # Role-based access control",
        "│   ├── validation.middleware.ts    # Request body validation",
        "│   ├── rate-limit.middleware.ts    # API rate limiting",
        "│   └── error-handler.middleware.ts # Global error handler",
        "├── routes/                         # Route files mapping URLs to controllers",
        "├── migrations/                     # All database migration files",
        "├── websocket/                      # WebSocket event handlers",
        "└── utils/                          # JWT helpers, logger, S3 client",
    ]
    for line in folder2:
        story.append(Paragraph(line.replace(' ', '&nbsp;').replace('<', '&lt;'), S['CodeBlock']))

    story.append(Spacer(1, 6))
    story.append(hr())

    # ===== PHASE 3: AI AGENTS =====
    story.append(Paragraph("Phase 3 — AI Agents", S['H1']))
    story.append(Paragraph(
        "Build 16 specialized AI agents that collaborate through an Orchestrator. Each agent handles one domain — document processing, requirements, knowledge retrieval, architecture design, database, APIs, cloud mapping, Terraform, security, cost, review, validation, documentation, versioning, and deployment. Agents share context through a common workspace and communicate via the Orchestrator which manages execution order, dependencies, and error recovery.",
        S['B']
    ))

    story.append(Paragraph("What to do", S['H2']))
    story.append(pt("Build a base agent class with common LLM calling logic, prompt management, and error handling.", S))
    story.append(pt("Build the Orchestrator Agent that manages the full workflow pipeline and handles retries/failures.", S))
    story.append(pt("Implement a shared workspace (context object) that accumulates all agent outputs.", S))
    story.append(pt("Build each of the 16 agents listed below with their specific prompts and processing logic.", S))
    story.append(pt("Set up vector database (Pinecone/Weaviate) for RAG knowledge storage.", S))
    story.append(pt("Write prompt templates for each agent stored in a prompts/ directory.", S))
    story.append(pt("Build agent execution logging for monitoring and debugging.", S))

    story.append(Paragraph("Agents", S['H2']))
    agents_data = [
        ['Orchestrator', 'Manages workflow order, invokes agents, handles errors and retries.'],
        ['Document Processing', 'Parses uploaded docs, extracts structured text, identifies sections/tables.'],
        ['Requirement', 'Extracts and categorizes requirements (functional, non-functional, constraints).'],
        ['RAG', 'Retrieves relevant enterprise knowledge from vector DB using similarity search.'],
        ['Architecture', 'Generates high-level system design — components, relationships, patterns.'],
        ['Database', 'Designs schemas, tables, relationships, indexes, selects DB technology.'],
        ['API', 'Designs REST endpoints, request/response schemas, produces OpenAPI spec.'],
        ['Cloud Mapping', 'Maps components to cloud services (AWS/Azure/GCP), estimates costs.'],
        ['Terraform', 'Generates production-ready Terraform modules from cloud mappings.'],
        ['Security', 'Validates architecture against security best practices and compliance rules.'],
        ['Cost Optimization', 'Estimates cloud costs, identifies savings, suggests right-sizing.'],
        ['Architecture Review', 'Scores architecture on completeness, consistency, security, scalability.'],
        ['Validation', 'Checks Terraform syntax, schema validity, cross-reference consistency.'],
        ['Documentation', 'Generates architecture docs, API docs, deployment guides, ADRs.'],
        ['Versioning', 'Creates immutable snapshots, generates change diffs between versions.'],
        ['Deployment', 'Executes Terraform init/plan/apply, monitors deployment, handles rollback.'],
    ]
    agents_table = tbl(
        ['Agent', 'Responsibility'],
        agents_data,
        widths=[1.4*inch, 5.1*inch]
    )
    story.append(agents_table)

    story.append(Paragraph("Agent Execution Flow", S['H2']))
    flow_steps = [
        "User uploads document",
        "Document Processing Agent → structures the content",
        "Requirement Agent → extracts categorized requirements",
        "RAG Agent → retrieves enterprise knowledge",
        "Architecture Agent → generates system design",
        "Database Agent → creates schema  |  API Agent → designs endpoints  (parallel)",
        "Cloud Mapping Agent → selects cloud services, estimates costs",
        "Terraform Agent → generates infrastructure code",
        "Security Agent → validates security  |  Validation Agent → checks correctness  (parallel)",
        "Cost Optimization Agent → analyzes pricing",
        "Architecture Review Agent → scores and produces findings",
        "Documentation Agent → generates docs",
        "Versioning Agent → creates version snapshot",
        "User receives complete architecture",
    ]
    for i, step in enumerate(flow_steps):
        story.append(Paragraph(f"<b>{i+1}.</b>&nbsp;&nbsp;{step}", S['Pt']))
        if i < len(flow_steps) - 1:
            story.append(Paragraph("↓", S['Arrow']))

    story.append(Paragraph("Agents Folder Structure", S['H2']))
    folder3 = [
        "agents/",
        "├── src/",
        "│   ├── common/",
        "│   │   ├── base.agent.ts          # Base class — LLM calls, retries, logging",
        "│   │   ├── agent.context.ts        # Shared workspace between agents",
        "│   │   ├── llm.client.ts           # LLM API client (OpenAI/Groq/Anthropic)",
        "│   │   └── prompt.manager.ts       # Loads and fills prompt templates",
        "│   ├── orchestrator/",
        "│   │   ├── orchestrator.agent.ts    # Workflow manager, agent sequencing",
        "│   │   ├── workflow.manager.ts      # Execution order, dependency graph",
        "│   │   └── agent.registry.ts        # Registers all available agents",
        "│   ├── document-processing/",
        "│   │   └── document.agent.ts        # Text extraction, structure parsing",
        "│   ├── requirement/",
        "│   │   └── requirement.agent.ts     # Requirement identification & categorization",
        "│   ├── rag/",
        "│   │   ├── rag.agent.ts             # Query formulation, knowledge retrieval",
        "│   │   ├── embeddings.service.ts    # Chunk text and generate embeddings",
        "│   │   └── vector.store.ts          # Pinecone/Weaviate client",
        "│   ├── architecture/",
        "│   │   └── architecture.agent.ts    # System design, component selection",
        "│   ├── database/",
        "│   │   └── database.agent.ts        # Schema design, tech selection",
        "│   ├── api/",
        "│   │   └── api.agent.ts             # Endpoint design, OpenAPI generation",
        "│   ├── cloud-mapping/",
        "│   │   ├── cloud-mapping.agent.ts   # Service selection, cost estimation",
        "│   │   └── providers/",
        "│   │       ├── aws.catalog.ts       # AWS service catalog & pricing",
        "│   │       ├── azure.catalog.ts     # Azure service catalog & pricing",
        "│   │       └── gcp.catalog.ts       # GCP service catalog & pricing",
        "│   ├── terraform/",
        "│   │   ├── terraform.agent.ts       # Terraform code generation",
        "│   │   └── generators/",
        "│   │       ├── aws/                 # AWS-specific Terraform modules",
        "│   │       ├── azure/               # Azure-specific Terraform modules",
        "│   │       └── gcp/                 # GCP-specific Terraform modules",
        "│   ├── security/",
        "│   │   ├── security.agent.ts        # Security validation & compliance",
        "│   │   └── policies/                # Compliance rules (SOC2, HIPAA, GDPR)",
        "│   ├── cost-optimization/",
        "│   │   └── cost.agent.ts            # Cost analysis & optimization",
        "│   ├── review/",
        "│   │   └── review.agent.ts          # Quality scoring & recommendations",
        "│   ├── validation/",
        "│   │   └── validation.agent.ts      # Syntax & consistency checks",
        "│   ├── documentation/",
        "│   │   ├── documentation.agent.ts   # Doc generation",
        "│   │   └── templates/               # Documentation templates",
        "│   ├── versioning/",
        "│   │   ├── versioning.agent.ts      # Snapshot creation",
        "│   │   └── diff.engine.ts           # Version comparison engine",
        "│   ├── deployment/",
        "│   │   └── deployment.agent.ts      # Terraform execution & monitoring",
        "│   └── types/                        # Agent type definitions",
        "├── prompts/                          # All prompt templates per agent",
        "├── tests/                            # Agent unit tests",
        "└── package.json",
    ]
    for line in folder3:
        story.append(Paragraph(line.replace(' ', '&nbsp;').replace('<', '&lt;'), S['CodeBlock']))

    story.append(Spacer(1, 8))
    story.append(hr())
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>End of Document</b>", S['B']))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"PDF generated: {OUTPUT}")

if __name__ == "__main__":
    build()
