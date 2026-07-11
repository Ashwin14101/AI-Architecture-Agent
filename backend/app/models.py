import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(80), nullable=False, unique=True)
    email = Column(String(200), nullable=False, unique=True)
    passwordHash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='user')
    organizationId = Column(String(36), nullable=True)
    refreshToken = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Project(Base):
    __tablename__ = "projects"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    ownerId = Column(String(36), nullable=False)
    organizationId = Column(String(36), nullable=True)
    status = Column(String(50), nullable=False, default='active')
    settings = Column(JSON, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Document(Base):
    __tablename__ = "documents"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    name = Column(String(255), nullable=False)
    filePath = Column(Text, nullable=False)
    fileSize = Column(Integer, nullable=False)
    extractedText = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Requirement(Base):
    __tablename__ = "requirements"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    documentId = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    priority = Column(String(50), nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class ArchitectureVersion(Base):
    __tablename__ = "architecture_versions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    versionNumber = Column(Integer, nullable=False)
    architectureData = Column(JSON, nullable=True)
    terraformCode = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    versionId = Column(String(36), nullable=False)
    status = Column(String(50), nullable=False, default='pending')
    score = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class ReviewFinding(Base):
    __tablename__ = "review_findings"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    reviewId = Column(String(36), nullable=False)
    ruleId = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default='pending')
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Deployment(Base):
    __tablename__ = "deployments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    versionId = Column(String(36), nullable=True)
    status = Column(String(50), nullable=False, default='pending')
    logOutput = Column(Text, nullable=True)
    environment = Column(String(100), nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    title = Column(String(255), nullable=False)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversationId = Column(String(36), nullable=False)
    sender = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class Knowledge(Base):
    __tablename__ = "knowledge"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    source = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class AgentExecution(Base):
    __tablename__ = "agent_executions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    projectId = Column(String(36), nullable=False)
    agentName = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    logs = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), nullable=False)
    action = Column(String(255), nullable=False)
    details = Column(JSON, nullable=True)
    createdAt = Column(DateTime, default=get_utcnow)
    updatedAt = Column(DateTime, default=get_utcnow, onupdate=get_utcnow)
