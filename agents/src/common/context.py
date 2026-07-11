# agents/src/common/context.py

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class Requirement(BaseModel):
    id: str
    text: str
    category: str  # functional, non-functional, constraint, compliance, integration
    priority: str  # critical, high, medium, low
    status: str = "active"

class ArchitectureComponent(BaseModel):
    id: str
    name: str
    type: str  # web-server, database, queue, cache, load-balancer
    description: str

class ComponentConnection(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    protocol: str  # HTTP, gRPC, AMQP, TCP
    description: str

    class Config:
        populate_by_name = True

class HighLevelArchitecture(BaseModel):
    components: List[ArchitectureComponent] = []
    connections: List[ComponentConnection] = []
    patterns: List[str] = []
    rationale: str = ""

class DatabaseTableField(BaseModel):
    name: str
    type: str
    constraints: Optional[str] = None

class DatabaseRelationship(BaseModel):
    target_table: str
    type: str  # one-to-many, one-to-one, many-to-many
    foreign_key: str

class DatabaseTable(BaseModel):
    name: str
    fields: List[DatabaseTableField]
    relationships: List[DatabaseRelationship] = []
    indexes: List[str] = []

class DatabaseSchema(BaseModel):
    tables: List[DatabaseTable] = []
    technology_selection: str = ""  # PostgreSQL, MongoDB, DynamoDB

class ApiEndpoint(BaseModel):
    path: str
    method: str  # GET, POST, PUT, DELETE, PATCH
    description: str
    request_body: Optional[str] = None
    response_body: Optional[str] = None
    auth_required: bool = True

class ApiSpecification(BaseModel):
    endpoints: List[ApiEndpoint] = []

class CloudServiceMapping(BaseModel):
    component_id: str
    service_name: str  # AWS ECS, Azure SQL, GCP Pub/Sub
    tier: str
    region: str
    estimated_monthly_cost: float

class SecurityFinding(BaseModel):
    severity: str  # critical, warning, suggestion
    title: str
    description: str
    recommendation: str

class CostOptimization(BaseModel):
    service_name: str
    current_cost: float
    optimized_cost: float
    recommendation: str

class ReviewReport(BaseModel):
    overall_score: float
    completeness: float
    consistency: float
    security: float
    scalability: float
    cost_efficiency: float
    findings: List[str] = []

class AgentLog(BaseModel):
    agent_name: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str  # started, completed, failed
    message: str

class AgentContext(BaseModel):
    project_id: str
    cloud_provider: str  # aws, azure, gcp
    raw_document_text: str = ""
    requirements: List[Requirement] = []
    architecture: HighLevelArchitecture = Field(default_factory=HighLevelArchitecture)
    database_schema: DatabaseSchema = Field(default_factory=DatabaseSchema)
    api_specification: ApiSpecification = Field(default_factory=ApiSpecification)
    cloud_mappings: List[CloudServiceMapping] = []
    terraform_code: Dict[str, str] = {}  # filename -> code content
    security_findings: List[SecurityFinding] = []
    cost_optimizations: List[CostOptimization] = []
    review_report: Optional[ReviewReport] = None
    agent_logs: List[AgentLog] = []
    retrieved_knowledge: List[str] = []

    def log(self, agent_name: str, status: str, message: str):
        self.agent_logs.append(AgentLog(
            agent_name=agent_name,
            status=status,
            message=message
        ))
