import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Bot, User, Sparkles, Paperclip, CheckCircle,
  ChevronDown, Loader2, Zap, MessageSquare, Database,
  Network, Globe, Code, Shield, DollarSign, Cloud,
  Play, ExternalLink, CheckCheck, AlertCircle,
} from 'lucide-react';
import useStore from '../../store/useStore';
import './AiPanel.css';
import { api } from '../api';

const AVAILABLE_MODELS = [
  'Gemini 3.5 Flash (High)',
  'Claude 3.5 Sonnet (Recommended)',
  'GPT-4o (Premium)',
  'Llama 3.1 70B (Open Source)',
];

const AGENTS = [
  { id: 'Orchestrator', label: 'Orchestrator', Icon: Sparkles, color: '#8b5cf6' },
  { id: 'Requirement Agent', label: 'Requirements', Icon: MessageSquare, color: '#3b82f6' },
  { id: 'Architecture Design Agent', label: 'Architecture', Icon: Network, color: '#06b6d4' },
  { id: 'Database Design Agent', label: 'Database', Icon: Database, color: '#f97316' },
  { id: 'API Specification Agent', label: 'API Spec', Icon: Globe, color: '#10b981' },
  { id: 'Cloud Service Mapping Agent', label: 'Cloud Mapping', Icon: Cloud, color: '#64748b' },
  { id: 'Terraform Generation Agent', label: 'Terraform', Icon: Code, color: '#ec4899' },
  { id: 'Security Audit Agent', label: 'Security', Icon: Shield, color: '#ef4444' },
  { id: 'Cost Optimization Agent', label: 'Cost Optimizer', Icon: DollarSign, color: '#eab308' },
];

const QUICK_ACTIONS = [
  { label: '🏗️ Design a microservices architecture', text: 'Design a microservices architecture for my application. What components should I include?' },
  { label: '🗄️ Plan a database schema', text: 'Help me plan an optimal database schema for this project. What tables and relationships do I need?' },
  { label: '🔌 Define REST API endpoints', text: 'What REST API endpoints should I define for this application? Give me a comprehensive list.' },
  { label: '☁️ Map cloud infrastructure', text: 'What cloud infrastructure (AWS/GCP/Azure) would you recommend for this architecture? Break down costs.' },
  { label: '🔒 Audit for security issues', text: 'Perform a security audit on this architecture. What are the potential vulnerabilities and how do I fix them?' },
];

const GREETING = `Hey there! 👋 I'm your **AI Architecture Assistant** — think of me as a senior solutions architect on demand.

I can help you:
• 🏗️ Design complete system architectures  
• 🗄️ Plan database schemas & relationships  
• 🔌 Define REST API endpoint specs  
• ☁️ Map and cost-optimize cloud infrastructure  
• 🔒 Audit your design for security issues  
• 💻 Generate Terraform IaC code

What are you building today?`;

// ── Conversational intent matching ─────────────────────────────────────────────
const GREETING_PATTERNS = [
  /^(hi|hello|hey|howdy|sup|hiya|yo|morning|good morning|good afternoon|good evening|what's up|whats up|how are you|how's it going|hows it going|greetings)[\s!?.]*$/i,
];

const THANKS_PATTERNS = [
  /^(thanks|thank you|thank you so much|thanks a lot|cheers|ty|thx|appreciated|great|nice|awesome|perfect|cool|sounds good|got it|ok|okay|k|alright)[\s!.]*$/i,
];

const CONVERSATIONAL_RESPONSES = {
  greeting: [
    "Hey! 😄 Good to see you. I'm all set and ready to help with your architecture. What are we building today?",
    "Hello! 👋 I'm your AI architecture partner. Want to run the full pipeline, or can I answer a specific question about your system design?",
    "Hi there! 🚀 Ready when you are. Ask me anything about your architecture, database, APIs, or cloud setup!",
  ],
  thanks: [
    "Happy to help! 😊 Let me know if you need anything else — design decisions, optimizations, or even Terraform code.",
    "Of course! That's what I'm here for. Anything else you'd like me to analyze or improve?",
    "Anytime! 🙌 Feel free to ask about security, costs, or any part of the architecture.",
  ],
  confused: [
    "I'm not quite sure what you mean — could you rephrase? I can help with architecture design, database schemas, APIs, cloud mapping, Terraform, and security audits.",
    "Hmm, I didn't catch that. Try asking something like 'design a microservices architecture' or 'run the requirements agent'!",
  ],
};

// ── Agent work command detection ────────────────────────────────────────────────
// ONLY triggers pipeline if user explicitly says run/start/execute/launch/generate + target
const WORK_COMMANDS = [
  // Explicit full pipeline runs
  {
    patterns: [
      /^(run|start|execute|launch|kick off|begin).*(pipeline|all agents|everything|analysis|full run)/i,
      /^run\s*$/i,
      /^start pipeline\s*$/i,
    ], action: 'pipeline', label: 'Full Pipeline'
  },

  // Explicit agent runs — must have run/start/execute + agent keyword
  {
    patterns: [
      /(run|start|execute|launch|trigger).*(requirement|req agent)/i,
      /^run requirements?\s*$/i,
    ], action: 'pipeline', label: 'Requirements Agent'
  },

  {
    patterns: [
      /(run|start|execute|generate|create|build).*(architect|system design|system context)/i,
    ], action: 'pipeline', label: 'Architecture Design Agent'
  },

  {
    patterns: [
      /(run|start|execute|generate|design|create).*(database|db schema|schema)/i,
    ], action: 'pipeline', label: 'Database Design Agent'
  },

  {
    patterns: [
      /(run|start|execute|generate|create|design).*(api spec|rest api|endpoints?)/i,
    ], action: 'pipeline', label: 'API Specification Agent'
  },

  {
    patterns: [
      /(run|start|execute|generate|map).*(cloud|aws|infrastructure plan)/i,
    ], action: 'pipeline', label: 'Cloud Service Mapping Agent'
  },

  {
    patterns: [
      /(run|start|execute|generate|compile).*(terraform|iac|infrastructure code)/i,
    ], action: 'pipeline', label: 'Terraform Generation Agent'
  },

  {
    patterns: [
      /(run|start|execute|perform|do).*(security audit|security check|security scan)/i,
    ], action: 'pipeline', label: 'Security Audit Agent'
  },

  {
    patterns: [
      /(run|start|execute|calculate|do).*(cost optim|cost estimate|cost analysis)/i,
    ], action: 'pipeline', label: 'Cost Optimization Agent'
  },
];

// ── Knowledge base for demo Q&A ──────────────────────────────────────────────
const QA_KB = [
  {
    patterns: [/what.*requirement|what.*req agent|explain.*requirement|requirement.*mean|how.*requirement/i],
    answer: `**Requirements Agent** 📋

The Requirements Agent is the first step in the pipeline. It:

• Parses your uploaded document (PRD, spec, brief) to extract functional and non-functional requirements
• Identifies key entities, constraints, and priorities
• Produces a structured requirement spec that all downstream agents use

Tip: Upload a detailed requirements document before running for best results! 📄`,
  },
  {
    patterns: [/what.*architecture agent|explain.*architecture|how.*architecture.*work|architecture.*agent.*do/i],
    answer: `**Architecture Design Agent** 🏗️

This agent takes your requirements and designs the system architecture:

• Creates logical system components (web servers, load balancers, databases, caches)
• Defines how components communicate (REST, WebSocket, message queues)
• Applies best practices like separation of concerns, horizontal scalability, and fault tolerance

Output: System Context diagram on the Canvas board.`,
  },
  {
    patterns: [/what.*database agent|explain.*database|how.*db.*work|database.*schema.*mean/i],
    answer: `**Database Design Agent** 🗄️

Designs your relational database structure:

• Creates normalized tables with proper primary & foreign keys
• Suggests appropriate data types and constraints
• Identifies relationships (one-to-many, many-to-many)
• Generates DDL SQL you can run directly

Output: DB Schema view on the Canvas board.`,
  },
  {
    patterns: [/what.*api agent|explain.*api|how.*api.*work|what.*rest api|endpoint.*mean/i],
    answer: `**API Specification Agent** 🔌

Generates a complete REST API contract:

• Defines all endpoints with HTTP methods (GET, POST, PUT, DELETE)
• Specifies request/response shapes and status codes
• Follows RESTful conventions and naming standards
• Generates OpenAPI-compatible specs

Output: API Specs view on the Canvas board.`,
  },
  {
    patterns: [/what.*terraform|explain.*terraform|how.*terraform.*work|what.*iac/i],
    answer: `**Terraform Generation Agent** 💻

Creates Infrastructure as Code (IaC):

• Generates Terraform .tf files for AWS/GCP/Azure
• Includes VPC, security groups, EC2/ECS, RDS, Load Balancers
• Parameterized for dev/staging/production environments
• Follows security and cost-optimization best practices

Output: Terraform editor on the Canvas board.`,
  },
  {
    patterns: [/what.*security agent|explain.*security|how.*security.*work|security.*audit.*mean/i],
    answer: `**Security Audit Agent** 🔒

Reviews your entire architecture for vulnerabilities:

• Checks for open ports, overly permissive IAM roles, unencrypted data
• Validates JWT/auth implementation
• Reviews network security groups and firewall rules
• Scores security posture and suggests fixes

A score of 90+ is considered production-ready.`,
  },
  {
    patterns: [/what.*cloud.*agent|explain.*cloud|how.*cloud.*work|aws.*mapping.*mean/i],
    answer: `**Cloud Service Mapping Agent** ☁️

Maps your logical components to actual cloud services:

• Suggests the right AWS/GCP/Azure service for each component
• Compares managed vs self-hosted options
• Estimates monthly costs per service
• Recommends regions based on your user base

For example: "Web Server" → Amazon EC2 t3.micro or ECS Fargate.`,
  },
  {
    patterns: [/what.*cost|how much.*cost|estimate.*price|monthly.*budget|pricing/i],
    answer: `**Cost Estimation** 💰

Based on the current architecture design:

• **EC2 t3.micro (Web)**: ~$8.50/month
• **Application Load Balancer**: ~$18/month
• **RDS PostgreSQL t3.micro**: ~$25/month
• **Data Transfer**: ~$5/month
• **CloudWatch Logs**: ~$3/month

**Total Estimated**: ~$63.25/month

Want me to optimize for a lower budget? Just ask! 💡`,
  },
  {
    patterns: [/how.*pipeline.*work|explain.*pipeline|what.*pipeline.*do|what.*agents.*do|overview.*agent/i],
    answer: `**How the AI Agent Pipeline Works** 🤖

The pipeline runs **15 specialized AI agents** in sequence:

1. **Document Processing** — Parses your requirements doc
2. **Requirement Extraction** — Identifies key needs
3. **RAG Querying** — Retrieves relevant design patterns
4. **Architecture Design** — Creates system blueprint
5. **Database Modelling** — Designs schema
6. **API Design** — Specs all endpoints
7. **Cloud Mapping** — Maps to AWS services
8. **Terraform Compilation** — Generates IaC code
9. **Security Auditing** — Checks vulnerabilities
10. **Cost Optimization** — Estimates & optimizes spend
11. **Syntax Validation** — Validates Terraform code
12. **Review Scoring** — Gives quality score
13. **Documentation** — Writes architecture docs
14. **Versioning** — Saves version snapshot
15. **Deployment Prep** — Final packaging

Say **"run pipeline"** to start! 🚀`,
  },
  {
    patterns: [/how.*upload|upload.*doc|attach.*file|what.*file.*format|document.*format/i],
    answer: `**Uploading Documents** 📎

You can upload your requirements in these formats:

• **PDF** — Product requirement documents, specs
• **DOCX** — Word documents
• **TXT** — Plain text requirements
• **JSON** — Structured data
• **Markdown (.md)** — Technical specs

Use the 📎 **clip icon** in the chat input, or the **Upload Document** button in the top header.

The better your requirements doc, the better the generated architecture! 📐`,
  },
];

function detectIntent(text) {
  const t = text.trim();
  if (GREETING_PATTERNS.some((p) => p.test(t))) return { type: 'greeting' };
  if (THANKS_PATTERNS.some((p) => p.test(t))) return { type: 'thanks' };
  // Only match work commands if they have explicit action verbs
  for (const cmd of WORK_COMMANDS) {
    if (cmd.patterns.some((p) => p.test(t))) return { type: 'work', action: cmd.action, label: cmd.label };
  }
  // Check knowledge base Q&A
  for (const qa of QA_KB) {
    if (qa.patterns.some((p) => p.test(t))) return { type: 'qa', answer: qa.answer };
  }
  return { type: 'chat' };
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── AgentRunningCard ────────────────────────────────────────────────────────────
function AgentRunningCard({ onViewCanvas, onDone }) {
  const pipelineStatus = useStore((s) => s.pipelineStatus);
  const pipelineProgress = useStore((s) => s.pipelineProgress);
  const currentAgent = useStore((s) => s.currentAgent);
  const logs = useStore((s) => s.logs);
  const agentStatuses = useStore((s) => s.agentStatuses);
  const qualityScore = useStore((s) => s.qualityScore);

  const isDone = pipelineStatus === 'completed';
  const isFailed = pipelineStatus === 'failed';

  const recentLogs = logs.slice(-4);

  const PIPELINE_STEPS = [
    { id: 'doc-processing', label: 'Document Processing', Icon: Sparkles, color: '#8b5cf6' },
    { id: 'requirement', label: 'Requirements Extraction', Icon: MessageSquare, color: '#3b82f6' },
    { id: 'rag', label: 'RAG Querying', Icon: Database, color: '#0ea5e9' },
    { id: 'architecture', label: 'Architecture Design', Icon: Network, color: '#06b6d4' },
    { id: 'database', label: 'Database Modelling', Icon: Database, color: '#f97316' },
    { id: 'api', label: 'API Spec Design', Icon: Globe, color: '#10b981' },
    { id: 'cloud-mapping', label: 'Cloud AWS Mapping', Icon: Cloud, color: '#64748b' },
    { id: 'terraform', label: 'Terraform Compilation', Icon: Code, color: '#ec4899' },
    { id: 'security', label: 'Security Auditing', Icon: Shield, color: '#ef4444' },
    { id: 'cost', label: 'Cost Optimization', Icon: DollarSign, color: '#eab308' },
    { id: 'validation', label: 'Syntax Validation', Icon: CheckCircle, color: '#22c55e' },
    { id: 'review', label: 'Review & Scoring', Icon: Sparkles, color: '#a855f7' },
    { id: 'documentation', label: 'Documentation', Icon: CheckCheck, color: '#3b82f6' },
    { id: 'versioning', label: 'Versioning', Icon: CheckCheck, color: '#94a3b8' },
    { id: 'deployment', label: 'Deployment Prep', Icon: Zap, color: '#10b981' },
  ];

  useEffect(() => {
    if (isDone) onDone?.();
  }, [isDone]);

  return (
    <div className="agent-card">
      {/* Header */}
      <div className="agent-card-header">
        <div className="agent-card-icon-wrap" style={{ background: isDone ? '#16a34a20' : isFailed ? '#dc262620' : '#8b5cf620' }}>
          {isDone
            ? <CheckCheck size={16} color="#16a34a" />
            : isFailed
              ? <AlertCircle size={16} color="#dc2626" />
              : <Loader2 size={16} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
          }
        </div>
        <div className="agent-card-info">
          <span className="agent-card-title">
            {isDone ? '✅ Pipeline Complete!' : isFailed ? '❌ Pipeline Failed' : `🤖 ${currentAgent || 'Initializing...'}`}
          </span>
          <span className="agent-card-sub">
            {isDone
              ? `All 15 agents ran successfully${qualityScore ? ` · Quality Score: ${qualityScore}/100 🏆` : ''}`
              : isFailed ? 'Check logs for error details'
                : 'AI agents are working on your architecture...'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="agent-card-progress-track">
        <div
          className="agent-card-progress-fill"
          style={{
            width: `${pipelineProgress}%`,
            background: isDone ? '#16a34a' : isFailed ? '#dc2626' : 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
          }}
        />
      </div>
      <div className="agent-card-progress-label">{pipelineProgress}% complete</div>

      {/* Agent step pills */}
      <div className="agent-card-steps">
        {PIPELINE_STEPS.map(({ id, label, Icon, color }) => {
          const status = agentStatuses[id];
          return (
            <div
              key={id}
              className={`agent-step-pill ${status === 'running' ? 'running' : status === 'success' ? 'success' : ''}`}
              style={status === 'running' ? { borderColor: color, color, background: `${color}15` } : status === 'success' ? { borderColor: '#16a34a44', color: '#16a34a', background: '#16a34a12' } : {}}
              title={label}
            >
              {status === 'running'
                ? <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />
                : status === 'success'
                  ? <CheckCircle size={9} />
                  : <Icon size={9} />}
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Live log tail */}
      {!isDone && recentLogs.length > 0 && (
        <div className="agent-card-logs">
          {recentLogs.map((log, i) => (
            <div key={i} className={`agent-log-line ${log.level}`}>
              <span className="agent-log-dot" />
              {log.message}
            </div>
          ))}
        </div>
      )}

      {/* Done CTA */}
      {isDone && (
        <div className="agent-card-cta">
          <button className="agent-cta-btn primary" onClick={() => { useStore.setState({ currentTab: 'board' }); onViewCanvas(); }}>
            <ExternalLink size={12} /> View Documentation
          </button>
          <button className="agent-cta-btn secondary" onClick={() => useStore.setState({ currentTab: 'board', canvasViewMode: 'system' })}>
            <Network size={12} /> System Architecture
          </button>
        </div>
      )}
    </div>
  );
}

// ── Inline markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(content, isStreaming, isLast) {
  const lines = (content || '').split('\n');
  return lines.map((line, li) => {
    if (!line && li > 0) return <div key={li} className="msg-spacer" />;
    const renderInline = (text) => {
      const parts = [];
      let remaining = text;
      let key = 0;
      while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const codeMatch = remaining.match(/`([^`]+)`/);
        const italicMatch = remaining.match(/\*(.+?)\*/);
        if (boldMatch && (!codeMatch || boldMatch.index <= codeMatch.index) && (!italicMatch || boldMatch.index <= italicMatch.index)) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
          parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
          remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        } else if (codeMatch && (!italicMatch || codeMatch.index <= italicMatch.index)) {
          parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
          parts.push(<code key={key++} className="msg-inline-code">{codeMatch[1]}</code>);
          remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
        } else if (italicMatch) {
          parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
          parts.push(<em key={key++}>{italicMatch[1]}</em>);
          remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        } else {
          parts.push(<span key={key++}>{remaining}</span>);
          remaining = '';
        }
      }
      return parts;
    };
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) return <div key={li} className="msg-list-item"><span className="msg-list-num">{numMatch[1]}.</span><span>{renderInline(numMatch[2])}</span></div>;
    if (line.match(/^[•\-\*]\s+/)) return <div key={li} className="msg-bullet"><span className="msg-bullet-dot">•</span><span>{renderInline(line.replace(/^[•\-\*]\s+/, ''))}</span></div>;
    if (line.match(/^##\s+/)) return <div key={li} className="msg-heading-2">{renderInline(line.replace(/^##\s+/, ''))}</div>;
    if (line.match(/^#\s+/)) return <div key={li} className="msg-heading">{renderInline(line.replace(/^#\s+/, ''))}</div>;
    return <div key={li}>{renderInline(line)}</div>;
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiPanel() {
  const currentProject = useStore((s) => s.currentProject);
  const uploadedDocument = useStore((s) => s.uploadedDocument);
  const uploadedDocuments = useStore((s) => s.uploadedDocuments);
  const activeModel = useStore((s) => s.activeModel);
  const activeAgentFocus = useStore((s) => s.activeAgentFocus);
  const toggleAgentFocus = useStore((s) => s.toggleAgentFocus);
  const setActiveModel = useStore((s) => s.setActiveModel);
  const startPipeline = useStore((s) => s.startPipeline);
  const pipelineStatus = useStore((s) => s.pipelineStatus);
  const setCanvasViewMode = useStore((s) => s.setCanvasViewMode);

  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'assistant', content: GREETING, isMarkdown: true },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [pipelineCardVisible, setPipelineCardVisible] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pipelineCardVisible]);
  
  useEffect(() => {
    async function loadMessages() {
      if (currentProject?.id) {
        try {
          const pastMessages = await api.getMessages(currentProject.id);
          if (pastMessages && pastMessages.length > 0) {
            setMessages(pastMessages.map(m => ({ sender: m.sender, content: m.content })));
          } else {
            setMessages([{ sender: 'assistant', content: GREETING, isMarkdown: true }]);
          }
        } catch(e) {
          console.error("Failed to load messages", e);
        }
      }
    }
    loadMessages();
  }, [currentProject?.id]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  // Insert a local instant response without calling backend
  const pushAssistantMessage = (content) => {
    setMessages((prev) => [...prev, { sender: 'assistant', content }]);
  };

  const triggerPipeline = useCallback(() => {
    const projectId = currentProject?.id;
    if (!projectId) {
      pushAssistantMessage("⚠️ Please select or create a project first before running agents!");
      return;
    }
    setPipelineCardVisible(true);
    startPipeline();
    pushAssistantMessage("🚀 Got it! I've kicked off the **AI Agent Pipeline**. Watch the live progress below — all 15 agents are running in sequence:");
  }, [currentProject, startPipeline]);

  const sendMessage = async (text, e) => {
    if (e) e.preventDefault();
    const msgText = (text || input).trim();
    if ((!msgText && attachedFiles.length === 0) || isStreaming) return;

    const projectId = currentProject?.id;
    let messageContent = msgText;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map((f) => f.name).join(', ');
      messageContent = `[Attached: ${fileNames}]\n${msgText}`;
    }

    setMessages((prev) => [...prev, { sender: 'user', content: messageContent }]);
    setInput('');
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);
    setShowQuickActions(false);

    if (filesToUpload.length > 0 && projectId) {
      try {
        await api.uploadDocument(projectId, filesToUpload[0]);
        const docs = await api.getDocuments(projectId);
        useStore.setState({ uploadedDocuments: docs || [] });
      } catch (err) {
        console.error(err);
      }
      setTimeout(() => {
        triggerPipeline();
      }, 500);
      return;
    }

    // ── Intent detection ────────────────────────────────────────────
    const intent = detectIntent(msgText);

    if (intent.type === 'greeting') {
      setTimeout(() => pushAssistantMessage(randomFrom(CONVERSATIONAL_RESPONSES.greeting)), 400);
      return;
    }

    if (intent.type === 'thanks') {
      setTimeout(() => pushAssistantMessage(randomFrom(CONVERSATIONAL_RESPONSES.thanks)), 300);
      return;
    }

    if (intent.type === 'qa') {
      // Stream in the answer word by word for a natural feel
      const words = intent.answer.split(' ');
      let built = '';
      setIsStreaming(true);
      setMessages((prev) => [...prev, { sender: 'assistant', content: '' }]);
      let i = 0;
      const iv = setInterval(() => {
        if (i < words.length) {
          built += (i === 0 ? '' : ' ') + words[i++];
          setMessages((prev) => {
            const u = [...prev];
            u[u.length - 1] = { sender: 'assistant', content: built };
            return u;
          });
        } else {
          clearInterval(iv);
          setIsStreaming(false);
        }
      }, 28);
      return;
    }

    if (intent.type === 'work') {
      setTimeout(() => triggerPipeline(), 300);
      return;
    }


    // ── Rename local command ─────────────────────────────────────────
    const renameMatch = messageContent.match(/rename\s+table\s+(\w+)\s+to\s+(\w+)/i);
    if (renameMatch) {
      setTimeout(() => {
        useStore.getState().updateGeneratedNode?.('database', renameMatch[1], renameMatch[2]);
        pushAssistantMessage(`✅ Done! I've renamed the database table **"${renameMatch[1]}"** → **"${renameMatch[2]}"** in the schema diagram.\n\nSwitch to the **DB Schema** view on the canvas to see the change.`);
      }, 600);
      return;
    }

    // ── Real backend chat ────────────────────────────────────────────
    if (!projectId) {
      pushAssistantMessage("⚠️ Please select or create a project first before chatting with the AI!");
      return;
    }

    setIsStreaming(true);
    setMessages((prev) => [...prev, { sender: 'assistant', content: '⏳ Thinking...' }]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/chat/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      // Clear the "Thinking..." placeholder when first token arrives
      let firstChunk = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        decoder.decode(value).split('\n').forEach((line) => {
          if (line.startsWith('data: ')) {
            if (firstChunk) {
              assistantText = '';
              firstChunk = false;
            }
            assistantText += line.slice(6).replace(/\\n/g, '\n'); // decode escaped newlines
            setMessages((prev) => {
              const u = [...prev];
              u[u.length - 1] = { sender: 'assistant', content: assistantText };
              return u;
            });
          }
        });
      }
      // If nothing came back, give a clear error
      if (!assistantText) throw new Error('Empty response');
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          sender: 'assistant',
          content: "⚠️ Couldn't reach the AI backend right now.\n\nMake sure the backend server is running:\n```\ncd backend && python3 run.py\n```\n\nOr ask me about the pipeline, agents, or architecture — I can answer those locally! 🤖",
        };
        return u;
      });
    } finally {
      setIsStreaming(false);
    }

  };

  const agentLabel = Array.isArray(activeAgentFocus) && activeAgentFocus.length > 0
    ? activeAgentFocus.length === 1
      ? activeAgentFocus[0]
      : `${activeAgentFocus[0]} +${activeAgentFocus.length - 1} more`
    : 'Select agents';

  return (
    <div className="chat-page">
      {/* ── Left Sidebar ─────────────────────────── */}
      {/* ── Left Sidebar ─────────────────────────── */}
      <aside className="chat-sidebar">
        {/* Quick Pipeline Trigger */}
        <div className="sidebar-section">
          <p className="sidebar-section-label">Quick Actions</p>
          <button
            className="sidebar-run-btn"
            onClick={() => {
              setShowQuickActions(false);
              triggerPipeline();
            }}
            disabled={pipelineStatus === 'running'}
          >
            {pipelineStatus === 'running'
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Pipeline Running...</>
              : <><Play size={13} fill="currentColor" /> Run Full Pipeline</>}
          </button>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          <p className="sidebar-section-label">Uploaded Documents</p>
          {uploadedDocuments && uploadedDocuments.length > 0 ? (
            <div className="sidebar-docs-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {uploadedDocuments.map((doc, idx) => (
                <div key={doc.id || idx} className="sidebar-doc-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <CheckCircle size={12} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span className="sidebar-doc-name" title={doc.name} style={{ fontSize: '11px', color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sidebar-no-doc">No documents attached yet. Use the clip icon to attach files.</p>
          )}
        </div>
      </aside>

      {/* ── Chat Area ─────────────────────────────── */}
      <div className="chat-area" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* ChatGPT-style Chat Header with Model & Agent Selectors */}
        <div className="chat-workspace-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', background: '#ffffff', borderBottom: '1px solid #f1f5f9', zIndex: 10 }}>
          <div className="chat-header-selector" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="selector-prefix" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Model:</span>
            <select
              className="chat-header-select"
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: '#334155', background: '#f8fafc', outline: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          <div className="chat-header-selector agent-focus-selector" style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
            <span className="selector-prefix" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Focus:</span>
            <button
              className="chat-header-select agent-focus-trigger"
              onClick={() => setAgentDropdownOpen((o) => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: '#334155', background: '#f8fafc', outline: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <span>{agentLabel}</span>
              <ChevronDown size={11} style={{ color: '#94a3b8', transition: 'transform 0.2s', transform: agentDropdownOpen ? 'rotate(180deg)' : '' }} />
            </button>
            
            {agentDropdownOpen && (
              <>
                <div className="agent-selector-overlay" onClick={() => setAgentDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                <div className="agent-selector-menu chat-header-dropdown-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '220px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden', padding: '6px' }}>
                  {AGENTS.map(({ id, label, Icon, color }) => {
                    const checked = Array.isArray(activeAgentFocus) ? activeAgentFocus.includes(id) : activeAgentFocus === id;
                    return (
                      <label key={id} className="agent-option" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.12s', userSelect: 'none' }}>
                        <div className="agent-option-left" style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                          <div className="agent-option-icon" style={{ width: '24px', height: '24px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${color}18`, color }}>
                            <Icon size={11} />
                          </div>
                          <span>{label}</span>
                        </div>
                        <div className={`agent-checkbox ${checked ? 'checked' : ''}`} style={{ width: '18px', height: '18px', borderRadius: '5px', border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', ...(checked ? { background: color, borderColor: color, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' } : {}) }}>
                          {checked && <CheckCircle size={10} color="white" />}
                          <input type="checkbox" checked={checked} onChange={() => toggleAgentFocus(id)} style={{ display: 'none' }} />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Active agent pills in header */}
          {Array.isArray(activeAgentFocus) && activeAgentFocus.length > 0 && (
            <div className="active-agent-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginLeft: '8px' }}>
              {activeAgentFocus.map((a) => {
                const ag = AGENTS.find((x) => x.id === a);
                return (
                  <span key={a} className="agent-pill" style={{ fontSize: '10.5px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', border: '1px solid', borderColor: ag?.color + '44', color: ag?.color, background: ag?.color + '12' }}>
                    {ag?.label || a}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.sender}`}>
              <div className={`msg-avatar ${msg.sender}`}>
                {msg.sender === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={`msg-bubble ${msg.sender}`}>
                <div className="msg-text">
                  {renderMarkdown(msg.content, isStreaming, i === messages.length - 1)}
                </div>
                {isStreaming && i === messages.length - 1 && msg.sender === 'assistant' && msg.content === '' && (
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                )}
              </div>
            </div>
          ))}

          {pipelineCardVisible && (
            <div className="msg-row assistant">
              <div className="msg-avatar assistant">
                <Bot size={14} />
              </div>
              <div className="msg-bubble assistant agent-bubble">
                <AgentRunningCard
                  onViewCanvas={() => {
                    useStore.setState({ currentTab: 'board', canvasViewMode: 'docs' });
                  }}
                  onDone={() => {
                    setTimeout(() => {
                      pushAssistantMessage(
                        "🎉 All agents completed successfully! Your architecture documentation has been generated.\n\n**What's ready:**\n• System Architecture diagram\n• Database Schema design\n• REST API specifications\n• Cloud Infrastructure mapping\n• Terraform IaC code\n• Security audit & cost report\n\nYou're now in the **Documentation tab** — feel free to edit and export! Let me know if you need any changes."
                      );
                    }, 800);
                  }}
                />
              </div>
            </div>
          )}

        {/* Quick action chips — shown after greeting */}
        {showQuickActions && messages.length === 1 && (
          <div className="quick-actions">
            <p className="quick-actions-label">Quick starts:</p>
            <div className="quick-chips">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  className="quick-chip"
                  onClick={() => sendMessage(qa.text)}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attached file badges */}
      {attachedFiles.length > 0 && (
        <div className="attached-files-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px 12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="attached-file-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', color: '#475569' }}>
              <Paperclip size={11} color="#8b5cf6" />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              <button
                type="button"
                className="remove-file-btn"
                onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 2, color: '#94a3b8' }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <form className="chat-input-form" onSubmit={(e) => sendMessage(null, e)}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx,.json,.md"
          multiple={true}
        />

        <button
          type="button"
          className="chat-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          title="Attach documents"
        >
          <Paperclip size={16} />
        </button>

        <input
          className="chat-text-input"
          type="text"
          placeholder={isStreaming ? 'AI is responding...' : 'Ask anything, or say "run pipeline" to start all agents...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />

        <button
          type="submit"
          className={`chat-send-btn ${(!input.trim() && attachedFiles.length === 0) || isStreaming ? 'disabled' : 'active'}`}
          disabled={(!input.trim() && attachedFiles.length === 0) || isStreaming}
        >
          {isStreaming ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
        </button>
      </form>
    </div>
    </div >
  );
}
