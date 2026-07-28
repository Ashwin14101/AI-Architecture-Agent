import { create } from 'zustand';
import { api } from '../components/api';

const MOCK_DATA = {
  requirement: {
    description: "The system requires a highly scalable PostgreSQL database containing user profiles, session management, and product catalogs, deployed securely on AWS under a $200 monthly budget limit."
  },
  architecture: [
    { id: 'COMP-001', name: 'CloudStore Web Server', type: 'web-server', description: 'Serves React frontend assets from custom domains' },
    { id: 'COMP-002', name: 'Application Load Balancer', type: 'load-balancer', description: 'Balances HTTP/HTTPS traffic across ECS Fargate nodes' },
    { id: 'COMP-003', name: 'Product Catalog API', type: 'web-server', description: 'Handles catalog queries and user authentication' },
    { id: 'COMP-004', name: 'Main PostgreSQL DB', type: 'database', description: 'Stores user accounts, products, and order histories' }
  ],
  database: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'username', type: 'VARCHAR(80)', constraint: 'UNIQUE NOT NULL' },
        { name: 'email', type: 'VARCHAR(200)', constraint: 'UNIQUE NOT NULL' },
        { name: 'password_hash', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
        { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW()' }
      ]
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY' },
        { name: 'title', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
        { name: 'price', type: 'NUMERIC(10,2)', constraint: 'NOT NULL' },
        { name: 'stock', type: 'INT', constraint: 'DEFAULT 0' }
      ]
    }
  ],
  api: [
    { method: 'POST', path: '/api/auth/register', description: 'Creates a new user account' },
    { method: 'POST', path: '/api/auth/login', description: 'Logs in and returns JWT token' },
    { method: 'GET', path: '/api/products', description: 'Retrieves complete catalog list' },
    { method: 'POST', path: '/api/products', description: 'Adds new product (Admin only)' }
  ],
  'cloud-mapping': {
    mappings: [
      { logical_component: 'Web Server', aws_service: 'Amazon EC2 (t3.micro)' },
      { logical_component: 'Application Load Balancer', aws_service: 'Elastic Load Balancing (ALB)' },
      { logical_component: 'API Server', aws_service: 'Amazon EC2 (t3.micro)' },
      { logical_component: 'Database Server', aws_service: 'Amazon RDS PostgreSQL (db.t3.micro)' }
    ],
    costs: {
      total_estimated_monthly_cost: 63.25
    }
  },
  terraform: {
    terraformCode: `provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
}

resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  db_name              = "cloudstore"
  username             = "dbadmin"
  password             = "supersecure123"
  skip_final_snapshot  = true
}`
  },
  reviews: {
    score: 96,
    findings: [
      { ruleId: 'SEC-001', severity: 'medium', description: 'RDS database password is exposed in plaintext configurations.', recommendation: 'Use AWS Secrets Manager to store DB credentials.' }
    ]
  }
};

const useStore = create((set, get) => {
  let socket = null;
  let demoInterval = null;

  return {
    // Auth & Users
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticating: false,
    authError: null,
    isDemoMode: false,
    generatedProjectIds: ['demo-project-id'],

    // Projects
    projects: [],
    currentProject: null,
    uploadedDocument: null,
    uploadedDocuments: [],
    selectedNode: null,
    securityFindings: [],
    costData: null,
    setSelectedNode: (node) => set({ selectedNode: node }),
    setSecurityFindings: (findings) => set({ securityFindings: findings }),
    setCostData: (data) => set({ costData: data }),
    fetchCostData: async (projectId) => {
      try {
        const token = get().token;
        const res = await fetch(`http://localhost:3000/api/analysis/${projectId}/cost`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          set({ costData: data });
        }
      } catch (e) { console.error('Cost fetch error:', e); }
    },
    fetchScanResults: async (projectId) => {
      try {
        const token = get().token;
        const res = await fetch(`http://localhost:3000/api/analysis/${projectId}/scan-results`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          set({ securityFindings: data.findings || [] });
        }
      } catch (e) { console.error('Scan fetch error:', e); }
    },
    runSecurityScan: async (projectId) => {
      try {
        const token = get().token;
        const res = await fetch(`http://localhost:3000/api/analysis/${projectId}/scan`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          set({ securityFindings: data.findings || [] });
          return data;
        }
      } catch (e) { console.error('Scan error:', e); }
    },
    fetchDiff: async (projectId, v1, v2) => {
      try {
        const token = get().token;
        const res = await fetch(`http://localhost:3000/api/projects/${projectId}/compare?v1=${v1}&v2=${v2}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) return await res.json();
      } catch (e) { console.error('Diff error:', e); }
      return null;
    },

    // Canvas UI
    activeTool: 'select',
    setActiveTool: (tool) => set({ activeTool: tool }),
    zoomLevel: 100,
    setZoomLevel: (level) => set({ zoomLevel: Math.round(level * 100) }),
    canvasViewMode: 'system', // 'system' | 'database' | 'apis' | 'docs' | 'terraform'
    setCanvasViewMode: (mode) => set({ canvasViewMode: mode }),
    currentTab: 'chat', // 'chat' | 'board'
    setCurrentTab: (tab) => set({ currentTab: tab }),
    generatedData: null, // { components: [], database_schema: [], apis: [], cloud_mappings: [], costs: {} }
    activeModel: 'Claude 3.5 Sonnet (Recommended)',
    activeAgentFocus: ['Orchestrator'],
    setActiveModel: (model) => set({ activeModel: model }),
    setActiveAgentFocus: (focus) => set((state) => {
      const arr = Array.isArray(focus) ? focus : [focus];
      return { activeAgentFocus: arr };
    }),
    toggleAgentFocus: (agent) => set((state) => {
      const isSelected = state.activeAgentFocus.includes(agent);
      const updated = isSelected
        ? state.activeAgentFocus.filter((a) => a !== agent)
        : [...state.activeAgentFocus, agent];
      return { activeAgentFocus: updated.length > 0 ? updated : ['Orchestrator'] };
    }),
    documentationMarkdown: `# Executive Architecture Specifications

## 1. Project Overview

This document outlines the complete architecture for the **CloudStore E-commerce Portal** — a highly scalable, secure, and cost-optimized platform deployed on AWS.

> Edit this document directly. All changes are saved locally. Use the Save button to persist to the backend.

## 2. System Components

| Component | Type | Description |
|---|---|---|
| CloudStore Web Server | web-server | Serves React frontend assets via CloudFront CDN |
| Application Load Balancer | load-balancer | Distributes HTTP/HTTPS traffic across ECS Fargate containers |
| Product Catalog API | web-server | Handles catalog queries, search, and user authentication |
| Main PostgreSQL DB | database | Primary data store for users, products, and orders (RDS) |

## 3. Database Schema

### users
| Column | Type | Constraint |
|---|---|---|
| id | UUID | PRIMARY KEY |
| username | VARCHAR(80) | UNIQUE NOT NULL |
| email | VARCHAR(200) | UNIQUE NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

### products
| Column | Type | Constraint |
|---|---|---|
| id | UUID | PRIMARY KEY |
| title | VARCHAR(255) | NOT NULL |
| price | NUMERIC(10,2) | NOT NULL |
| stock | INT | DEFAULT 0 |

## 4. API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Creates a new user account |
| POST | /api/auth/login | Authenticates and returns JWT token |
| GET | /api/products | Retrieves complete product catalog |
| POST | /api/products | Adds new product (Admin only) |

## 5. Cloud Infrastructure

- Web Tier: **Amazon EC2 t3.micro** (auto-scaled via ECS Fargate)
- Load Balancing: **Elastic Load Balancing (ALB)**
- Database: **Amazon RDS PostgreSQL db.t3.micro**
- Estimated Monthly Cost: **$63.25/month**

## 6. Security Considerations

- All EC2 instances in private subnets with NAT Gateway for outbound
- JWT-based stateless authentication with 1-hour token expiry
- RDS encrypted at rest using AWS KMS
- Security Groups restrict DB access to application tier only

## 7. Quality Score

Overall architecture quality score: **96/100** ✅`,
    setDocumentationMarkdown: (markdown) => set({ documentationMarkdown: markdown, unsavedChanges: true }),

    editableTerraformCode: '',
    setEditableTerraformCode: (code) => set({ editableTerraformCode: code, unsavedChanges: true }),
    versions: [],
    unsavedChanges: false,

    // Action to edit logical component, API route, or database schema in real-time
    updateGeneratedNode: (nodeType, targetId, newLabel, oldPath) => {
      set((state) => {
        if (!state.generatedData) return {};
        const updated = { ...state.generatedData };

        if (nodeType === 'system' && updated.components) {
          updated.components = updated.components.map((c) =>
            c.id === targetId ? { ...c, name: newLabel } : c
          );
        } else if (nodeType === 'database' && updated.database_schema) {
          updated.database_schema = updated.database_schema.map((t) =>
            t.name === targetId ? { ...t, name: newLabel } : t
          );
        } else if (nodeType === 'database-columns' && updated.database_schema) {
          updated.database_schema = updated.database_schema.map((t) =>
            t.name === targetId ? { ...t, columns: newLabel } : t
          );
        } else if (nodeType === 'apis' && updated.apis) {
          updated.apis = updated.apis.map((a) =>
            a.path === oldPath ? { ...a, path: newLabel } : a
          );
        } else if (nodeType === 'apis-list' && updated.apis) {
          updated.apis = newLabel;
        }

        return { generatedData: updated, unsavedChanges: true };
      });
    },

    // Pipeline Execution State
    pipelineStatus: 'idle', // idle | running | completed | failed
    pipelineProgress: 0,
    currentAgent: null,
    logs: [],

    // 15 Agent statuses
    agentStatuses: {
      'doc-processing': 'idle',
      'requirement': 'idle',
      'rag': 'idle',
      'architecture': 'idle',
      'database': 'idle',
      'api': 'idle',
      'cloud-mapping': 'idle',
      'terraform': 'idle',
      'security': 'idle',
      'cost': 'idle',
      'validation': 'idle',
      'review': 'idle',
      'documentation': 'idle',
      'versioning': 'idle',
      'deployment': 'idle',
    },

    // Quality Score (Review Score)
    qualityScore: null,

    // Layout States
    isDrawerOpen: false,
    isAiPanelOpen: false,
    contextMenu: null,

    // Sliding details panel
    selectedNodeId: null,
    selectedNodeData: null,
    isLoadingDetails: false,

    // Actions
    setPipelineStatus: (status) => set({ pipelineStatus: status }),
    setPipelineProgress: (progress) => set({ pipelineProgress: progress }),
    setCurrentAgent: (agent) => set({ currentAgent: agent }),

    setAgentStatus: (agentId, status) =>
      set((state) => ({
        agentStatuses: { ...state.agentStatuses, [agentId]: status },
      })),

    resetAllAgentStatuses: () =>
      set((state) => ({
        agentStatuses: Object.fromEntries(
          Object.keys(state.agentStatuses).map((key) => [key, 'idle'])
        ),
      })),

    addLog: (log) =>
      set((state) => ({
        logs: [...state.logs, { ...log, timestamp: new Date().toISOString() }],
      })),

    clearLogs: () => set({ logs: [] }),
    setQualityScore: (score) => set({ qualityScore: score }),
    toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    setDrawerOpen: (open) => set({ isDrawerOpen: open }),
    toggleAiPanel: () => set((state) => ({ isAiPanelOpen: !state.isAiPanelOpen })),
    setAiPanelOpen: (open) => set({ isAiPanelOpen: open }),
    showContextMenu: (x, y, nodeId) => set({ contextMenu: { x, y, nodeId } }),
    hideContextMenu: () => set({ contextMenu: null }),

    // Select node to show sliding details
    selectNode: async (nodeId) => {
      if (!nodeId) {
        set({ selectedNodeId: null, selectedNodeData: null });
        return;
      }

      set({ selectedNodeId: nodeId, selectedNodeData: null, isLoadingDetails: true });

      // Fallback to rich mock data in Demo Mode
      if (get().isDemoMode) {
        setTimeout(() => {
          let mockRes = null;
          if (nodeId === 'security' || nodeId === 'validation' || nodeId === 'review') {
            mockRes = MOCK_DATA.reviews;
          } else {
            mockRes = MOCK_DATA[nodeId] || { message: "Specifications loaded successfully in demo." };
          }
          set({ selectedNodeData: mockRes, isLoadingDetails: false });
        }, 300);
        return;
      }

      const project = get().currentProject;
      if (!project) {
        set({ isLoadingDetails: false });
        return;
      }

      try {
        let data = null;
        switch (nodeId) {
          case 'requirement':
            data = await api.getProject(project.id);
            break;
          case 'architecture':
            data = await api.getArchitecture(project.id);
            break;
          case 'database':
            data = await api.getDatabaseSchema(project.id);
            break;
          case 'api':
            data = await api.getApis(project.id);
            break;
          case 'cloud-mapping':
            data = await api.getCloudMapping(project.id);
            break;
          case 'terraform':
            data = await api.getTerraform(project.id);
            break;
          case 'security':
          case 'validation':
          case 'review':
            data = await api.getReviews(project.id);
            break;
          default:
            data = { message: "No detailed view generated yet for this phase." };
        }
        set({ selectedNodeData: data, isLoadingDetails: false });
      } catch (err) {
        console.error("Error loading node details:", err);
        set({ selectedNodeData: { error: err.message }, isLoadingDetails: false });
      }
    },

    // Developer Auto-Login with transparent Demo fallbacks
    autoLogin: async () => {
      set({ isAuthenticating: true, authError: null });
      try {
        // Try logging in with standard developer account
        await api.login('dev_client@nextgenads.ai', 'password123');
        const userRes = await api.getMe();
        set({ user: userRes.user, token: localStorage.getItem('token'), isAuthenticating: false, isDemoMode: false });
        await get().fetchProjects();
      } catch (loginErr) {
        // If login fails, try registering the developer account
        try {
          await api.register('dev_client', 'dev_client@nextgenads.ai', 'password123');
          await api.login('dev_client@nextgenads.ai', 'password123');
          const userRes = await api.getMe();
          set({ user: userRes.user, token: localStorage.getItem('token'), isAuthenticating: false, isDemoMode: false });
          await get().fetchProjects();
        } catch (regErr) {
          console.warn("Backend auth failed. Launching in Interactive Demo Mode.");
          // Safe fallback so the UI is fully functional and interactive
          const demoUser = { id: 'demo-user', username: 'developer_demo', email: 'demo@nextgenads.ai', role: 'user' };
          const demoProject = { id: 'demo-project-id', name: 'Demo CloudStore Portal', description: 'Pre-loaded demo architecture environment' };
          set({
            user: demoUser,
            isDemoMode: true,
            isAuthenticating: false,
            projects: [demoProject],
            currentProject: demoProject
          });
          get().addLog({ level: 'info', message: 'Workspace running in Local Interactive Demo Mode.' });
        }
      }
    },

    // Projects Management
    fetchProjects: async () => {
      if (get().isDemoMode) return;
      try {
        const res = await api.getProjects();
        if (res.projects.length === 0) {
          // Auto-create a default project on the backend if none exist
          const newProj = await api.createProject("CloudStore E-commerce Portal", "A scalable e-commerce application designed to run on AWS.");
          set({ projects: [newProj], currentProject: newProj });
          get().selectProject(newProj);
        } else {
          set({ projects: res.projects });
          if (!get().currentProject) {
            get().selectProject(res.projects[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    },

    selectProject: async (project) => {
      set({ currentProject: project, uploadedDocument: null, uploadedDocuments: [], generatedData: null, canvasViewMode: 'system' });
      get().resetAllAgentStatuses();
      get().clearLogs();
      set({ qualityScore: null, selectedNodeId: null, selectedNodeData: null });

      if (get().isDemoMode) {
        await get().fetchGeneratedData(project.id);
        return;
      }

      try {
        const arch = await api.getArchitecture(project.id);
        if (arch) {
          set((state) => {
            const updated = { ...state.agentStatuses };
            Object.keys(updated).forEach((key) => {
              updated[key] = 'success';
            });
            return { agentStatuses: updated, canvasViewMode: 'system' };
          });
          const review = await api.getReviews(project.id);
          if (review) {
            set({ qualityScore: review.score });
          }
          await get().fetchGeneratedData(project.id);
          
          try {
            const docs = await api.getDocuments(project.id);
            set({ uploadedDocuments: docs || [] });
          } catch(e) {
            console.log("No documents found or error fetching docs");
          }
        }
      } catch (e) {
        console.log("No existing design for selected project");
        // Still try to fetch documents even if no architecture exists
        try {
          const docs = await api.getDocuments(project.id);
          set({ uploadedDocuments: docs || [] });
        } catch(err) {
          // ignore
        }
      }
    },

    fetchGeneratedData: async (projectId) => {
      if (get().isDemoMode) {
        if (get().generatedProjectIds?.includes(projectId)) {
          set({
            generatedData: {
              components: MOCK_DATA.architecture || [],
              database_schema: MOCK_DATA.database || [],
              apis: MOCK_DATA.api || [],
              cloud_mappings: MOCK_DATA['cloud-mapping']?.mappings || [],
              costs: MOCK_DATA['cloud-mapping']?.costs || {}
            },
            documentationMarkdown: `# Executive Architecture Specifications

## 1. Project Overview

This document outlines the complete architecture for the **CloudStore E-commerce Portal** — a highly scalable, secure, and cost-optimized platform deployed on AWS.

## 2. System Components

- **CloudStore Web Server** — Serves React frontend assets via CloudFront CDN
- **Application Load Balancer** — Distributes HTTP/HTTPS traffic across ECS Fargate containers
- **Product Catalog API** — Handles catalog queries, search, and user authentication
- **Main PostgreSQL DB** — Primary data store for users, products, and orders (RDS)

## 3. Database Schema

### users
| Column | Type | Constraint |
|---|---|---|
| id | UUID | PRIMARY KEY |
| username | VARCHAR(80) | UNIQUE NOT NULL |
| email | VARCHAR(200) | UNIQUE NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

### products
| Column | Type | Constraint |
|---|---|---|
| id | UUID | PRIMARY KEY |
| title | VARCHAR(255) | NOT NULL |
| price | NUMERIC(10,2) | NOT NULL |
| stock | INT | DEFAULT 0 |

## 4. API Endpoints

- **POST /api/auth/register** — Creates a new user account
- **POST /api/auth/login** — Authenticates and returns JWT token
- **GET /api/products** — Retrieves complete product catalog
- **POST /api/products** — Adds new product (Admin only)

## 5. Cloud Infrastructure

- Web Tier: **Amazon EC2 t3.micro** (auto-scaled via ECS Fargate)
- Load Balancing: **Elastic Load Balancing (ALB)**
- Database: **Amazon RDS PostgreSQL db.t3.micro**
- Estimated Monthly Cost: **$63.25/month**

## 6. Security Considerations

- All EC2 instances in private subnets with NAT Gateway for outbound
- JWT-based stateless authentication with 1-hour token expiry
- RDS encrypted at rest using AWS KMS
- Security Groups restrict DB access to application tier only

## 7. Quality Score

Overall architecture quality score: **96/100** ✅`,
            editableTerraformCode: MOCK_DATA.terraform.terraformCode,
            versions: [{ id: 'v1', versionNumber: 1, createdAt: new Date().toISOString() }],
            unsavedChanges: false
          });
        } else {
          set({
            generatedData: null,
            documentationMarkdown: '',
            editableTerraformCode: '',
            versions: [],
            unsavedChanges: false,
            qualityScore: null
          });
        }
        return;
      }
      try {
        const [components, database_schema, apis, cloud_data, tfRes] = await Promise.all([
          api.getArchitecture(projectId).catch(() => []),
          api.getDatabaseSchema(projectId).catch(() => []),
          api.getApis(projectId).catch(() => []),
          api.getCloudMapping(projectId).catch(() => ({ mappings: [], costs: {} })),
          api.getTerraform(projectId).catch(() => null)
        ]);
        set({
          generatedData: {
            components: components || [],
            database_schema: database_schema || [],
            apis: apis || [],
            cloud_mappings: cloud_data?.mappings || [],
            costs: cloud_data?.costs || {}
          },
          editableTerraformCode: tfRes ? tfRes.terraformCode : '',
          unsavedChanges: false
        });

        // Load document and versions asynchronously
        get().fetchDocumentation(projectId);
        get().fetchVersions(projectId);
      } catch (err) {
        console.error("Error fetching generated workspace data:", err);
      }
    },

    fetchDocumentation: async (projectId) => {
      try {
        const res = await api.getDocumentation(projectId);
        set({ documentationMarkdown: res.markdown });
      } catch (err) {
        console.error("Error fetching documentation:", err);
      }
    },

    saveDocumentation: async (markdown) => {
      const proj = get().currentProject;
      if (!proj) return;

      if (get().isDemoMode) {
        set({ documentationMarkdown: markdown, unsavedChanges: false });
        get().addLog({ level: 'success', message: 'Demo Save: Updated architecture documentation successfully.' });
        return;
      }

      try {
        await api.saveDocumentation(proj.id, markdown);
        set({ documentationMarkdown: markdown, unsavedChanges: false });
        get().addLog({ level: 'success', message: 'Saved documentation modifications successfully!' });
      } catch (err) {
        get().addLog({ level: 'error', message: `Failed to save documentation: ${err.message}` });
      }
    },

    saveArchitecture: async () => {
      const proj = get().currentProject;
      const data = get().generatedData;
      if (!proj || !data) return;

      if (get().isDemoMode) {
        set({ unsavedChanges: false });
        get().addLog({ level: 'success', message: 'Demo Save: Saved custom architecture specs structure.' });
        return;
      }

      try {
        // Fetch raw terraform string to submit alongside updates
        const tfRes = await api.getTerraform(proj.id).catch(() => null);
        const tfCode = tfRes ? tfRes.terraformCode : null;

        await api.saveArchitecture(proj.id, data, tfCode);
        set({ unsavedChanges: false });
        get().addLog({ level: 'success', message: 'Committed custom design schema changes to DB successfully!' });
        get().fetchGeneratedData(proj.id);
      } catch (err) {
        get().addLog({ level: 'error', message: `Failed to save architecture changes: ${err.message}` });
      }
    },

    fetchVersions: async (projectId) => {
      try {
        const res = await api.getVersions(projectId);
        set({ versions: res });
      } catch (err) {
        console.error("Error fetching project versions:", err);
      }
    },

    createProject: async (name, description) => {
      if (get().isDemoMode) {
        const newProj = { id: `demo-id-${Date.now()}`, name, description };
        set((state) => ({
          projects: [...state.projects, newProj],
          currentProject: newProj
        }));
        get().selectProject(newProj);
        get().addLog({ level: 'success', message: `Created demo project: ${name}` });
        return;
      }

      try {
        const newProj = await api.createProject(name, description);
        await get().fetchProjects();
        get().selectProject(newProj);
      } catch (err) {
        console.error("Error creating project:", err);
      }
    },

    uploadDoc: async (files) => {
      const proj = get().currentProject;
      if (!proj) return;

      const fileList = (files instanceof File) ? [files] : Array.from(files);
      if (fileList.length === 0) return;

      if (get().isDemoMode) {
        const newDocs = fileList.map((file, idx) => ({
          id: `mock-doc-${Date.now()}-${idx}`,
          name: file.name,
          fileSize: file.size
        }));
        set((state) => ({
          uploadedDocuments: [...state.uploadedDocuments, ...newDocs],
          uploadedDocument: newDocs[newDocs.length - 1]
        }));
        fileList.forEach(file => {
          get().addLog({ level: 'success', message: `Demo Upload: Attached document: ${file.name}` });
        });
        return;
      }

      for (const file of fileList) {
        try {
          const res = await api.uploadDocument(proj.id, file);
          const docObj = { id: res.id, name: res.name, fileSize: res.fileSize };
          set((state) => ({
            uploadedDocuments: [...state.uploadedDocuments, docObj],
            uploadedDocument: docObj
          }));
          get().addLog({ level: 'success', message: `Uploaded and parsed document: ${file.name}` });
        } catch (err) {
          get().addLog({ level: 'error', message: `Failed to upload ${file.name}: ${err.message}` });
        }
      }
    },

    // WebSocket pipeline trigger with client-side demo run interval fallback
    startPipeline: async () => {
      const proj = get().currentProject;
      if (!proj) return;

      get().resetAllAgentStatuses();
      get().clearLogs();
      set({ pipelineStatus: 'running', pipelineProgress: 0, currentAgent: null, isDrawerOpen: true });
      get().addLog({ level: 'info', message: 'Starting AI Agent Pipeline...' });

      // Run Client-side Mock updates in Demo Mode
      if (get().isDemoMode) {
        if (demoInterval) clearInterval(demoInterval);
        
        const pipelineSteps = [
          { agent: "Document Processing", id: "doc-processing", msg: "Parsing uploaded requirements document..." },
          { agent: "Requirement Extraction", id: "requirement", msg: "Extracting system rules and priorities..." },
          { agent: "RAG Querying", id: "rag", msg: "Retrieving design standards matching layout..." },
          { agent: "Architecture Design", id: "architecture", msg: "Creating logical container architecture blueprints..." },
          { agent: "Database Modelling", id: "database", msg: "Designing PostgreSQL relational tables and indexes..." },
          { agent: "API Design", id: "api", msg: "Generating REST API routes specifications..." },
          { agent: "Cloud AWS Mapping", id: "cloud-mapping", msg: "Mapping application parts to AWS services..." },
          { agent: "Terraform Code Compiling", id: "terraform", msg: "Compiling Terraform infrastructure configurations..." },
          { agent: "Security Auditing", id: "security", msg: "Scanning Terraform configurations for security rules..." },
          { agent: "Cost Optimization", id: "cost", msg: "Calculating cost optimize estimates..." },
          { agent: "Syntax Validation", id: "validation", msg: "Validating Terraform code compilation rules..." },
          { agent: "Review Scoring", id: "review", msg: "Auditing compliance and scoring design..." },
          { agent: "Documentation Compilation", id: "documentation", msg: "Compiling architecture specifications book..." },
          { agent: "Versioning", id: "versioning", msg: "Saving new design version tags..." },
          { agent: "Local Deployment Prep", id: "deployment", msg: "Preparing final local package..." }
        ];

        let index = 0;
        demoInterval = setInterval(() => {
          if (index < pipelineSteps.length) {
            const step = pipelineSteps[index];
            const progress = Math.round(((index + 1) / pipelineSteps.length) * 100);
            
            set({ pipelineProgress: progress, currentAgent: step.agent });
            get().addLog({ level: 'info', message: `Step ${index+1}/${pipelineSteps.length}: Running ${step.agent}...` });
            get().addLog({ level: 'success', message: step.msg });

            set((state) => {
              const updated = { ...state.agentStatuses };
              if (index > 0) {
                const prevId = pipelineSteps[index - 1].id;
                updated[prevId] = 'success';
              }
              updated[step.id] = 'running';
              return { agentStatuses: updated };
            });
            index++;
          } else {
            clearInterval(demoInterval);
            // Mark project as generated in Demo mode
            set((state) => ({
              generatedProjectIds: [...(state.generatedProjectIds || []), proj.id]
            }));
            get().fetchGeneratedData(proj.id);
            set({ pipelineStatus: 'completed', pipelineProgress: 100, currentAgent: null, qualityScore: 96, canvasViewMode: 'docs' });
            set((state) => {
              const updated = { ...state.agentStatuses };
              Object.keys(updated).forEach(k => { updated[k] = 'success'; });
              return { agentStatuses: updated };
            });
            get().addLog({ level: 'success', message: '✅ Pipeline complete! Documentation is ready — check the Docs tab.' });
          }
        }, 300);


        return;
      }

      try {
        get().connectSocket(proj.id);
        await api.startAnalysis(proj.id);
      } catch (err) {
        set({ pipelineStatus: 'failed' });
        get().addLog({ level: 'error', message: `Failed to start pipeline: ${err.message}` });
      }
    },

    connectSocket: (projectId) => {
      if (socket) {
        socket.close();
      }

      socket = new WebSocket(`ws://localhost:3000/api/projects/${projectId}/ws`);

      socket.onopen = () => {
        get().addLog({ level: 'info', message: 'WebSocket tunnel connected.' });
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'analysis_update') {
            const { status, progress, message, agent, score } = msg.data;

            if (status === 'in_progress') {
              set({ pipelineStatus: 'running', pipelineProgress: progress, currentAgent: agent });
              get().addLog({ level: 'info', message });

              const mapAgentToId = {
                "Document Processing": "doc-processing",
                "Requirement Extraction": "requirement",
                "RAG Querying": "rag",
                "Architecture Design": "architecture",
                "Database Modelling": "database",
                "API Design": "api",
                "Cloud AWS Mapping": "cloud-mapping",
                "Terraform Code Compiling": "terraform",
                "Security Auditing": "security",
                "Cost Optimization": "cost",
                "Syntax Validation": "validation",
                "Review Scoring": "review",
                "Documentation Compilation": "documentation",
                "Versioning": "versioning",
                "Local Deployment Prep": "deployment"
              };

              const currentId = mapAgentToId[agent];
              if (currentId) {
                set((state) => {
                  const updated = { ...state.agentStatuses };
                  Object.keys(updated).forEach((key) => {
                    if (updated[key] === 'running') updated[key] = 'success';
                  });
                  updated[currentId] = 'running';
                  return { agentStatuses: updated };
                });
              }
            } else if (status === 'completed') {
              if (score) set({ qualityScore: score });
              get().fetchGeneratedData(projectId);
              set({ pipelineStatus: 'completed', pipelineProgress: 100, currentAgent: null, canvasViewMode: 'docs' });

              set((state) => {
                const updated = { ...state.agentStatuses };
                Object.keys(updated).forEach((key) => {
                  updated[key] = 'success';
                });
                return { agentStatuses: updated };
              });

              get().addLog({ level: 'success', message: '✅ Pipeline complete! Your documentation is ready in the Docs tab.' });
              socket.close();
            } else if (status === 'failed') {
              set({ pipelineStatus: 'failed', pipelineProgress: 100, currentAgent: null });
              get().addLog({ level: 'error', message });

              set((state) => {
                const updated = { ...state.agentStatuses };
                Object.keys(updated).forEach((key) => {
                  if (updated[key] === 'running') updated[key] = 'error';
                });
                return { agentStatuses: updated };
              });
              socket.close();
            }
          }
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };

      socket.onclose = () => {
        get().addLog({ level: 'info', message: 'WebSocket tunnel closed.' });
      };

      socket.onerror = (err) => {
        console.error("Websocket error:", err);
        get().addLog({ level: 'error', message: 'WebSocket tunnel encountered an error.' });
      };
    },

    disconnectSocket: () => {
      if (socket) {
        socket.close();
        socket = null;
      }
      if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
      }
    }
  };
});

export default useStore;
