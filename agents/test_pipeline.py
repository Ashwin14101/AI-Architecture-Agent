# agents/test_pipeline.py

import os
from src.common.context import AgentContext
from src.document_processing.document_agent import DocumentProcessingAgent
from src.requirement.requirement_agent import RequirementAgent
from src.rag.rag_agent import RagAgent
from src.architecture.architecture_agent import ArchitectureAgent
from src.database.database_agent import DatabaseAgent
from src.api.api_agent import ApiAgent
from src.cloud_mapping.cloud_mapping_agent import CloudMappingAgent
from src.terraform.terraform_agent import TerraformAgent
from src.security.security_agent import SecurityAgent
from src.security.iac_scanner import IacScanner
from src.cost_optimization.cost_agent import CostAgent
from src.validation.validation_agent import ValidationAgent
from src.validation.programmatic_validator import ProgrammaticValidator
from src.review.review_agent import ReviewAgent
from src.documentation.documentation_agent import DocumentationAgent
from src.versioning.versioning_agent import VersioningAgent
from src.deployment.deployment_agent import DeploymentAgent

def test():
    print("--- Starting Full End-to-End Multi-Agent Pipeline Test ---")
    
    # 1. Verify key configuration is present
    api_key = os.getenv("GROQ_API_KEYS") or os.getenv("GEMINI_API_KEYS")
    print(f"[Test] Env Key Configuration Found: {api_key is not None}")

    # 2. Initialize a context workspace with unstructured text
    dummy_text = (
        "Project: CloudStore E-commerce Portal\n"
        "Creator: Ashwin, Vishnu, Anjaneyulu\n"
        "Overview:\n"
        "We want to build an e-commerce website. The frontend is React. The backend is Node.js. "
        "We need a database to store users and product catalog. Users must be able to register and login. "
        "The system should be highly scalable and deployed on AWS. "
        "Estimated budget is $200 per month. Non-functional requirements: the site must load in under 2 seconds. "
        "Security: passwords must be hashed."
    )
    
    context = AgentContext(project_id="test-proj-123", cloud_provider="aws")
    context.raw_document_text = dummy_text

    # 3. Instantiate all 12 agents
    doc_agent = DocumentProcessingAgent()
    req_agent = RequirementAgent()
    rag_agent = RagAgent()
    arch_agent = ArchitectureAgent()
    db_agent = DatabaseAgent()
    api_agent = ApiAgent()
    cloud_agent = CloudMappingAgent()
    tf_agent = TerraformAgent()
    sec_agent = SecurityAgent()
    iac_scanner = IacScanner()
    cost_agent = CostAgent()
    val_agent = ValidationAgent()
    prog_val_agent = ProgrammaticValidator()
    review_agent = ReviewAgent()
    doc_gen_agent = DocumentationAgent()
    version_agent = VersioningAgent()
    deploy_agent = DeploymentAgent()
    
    try:
        # Step 1: Clean raw requirements
        context = doc_agent.run(context)

        # Step 2: Extract requirements
        context = req_agent.run(context)
        
        # Step 3: Run RAG search
        context = rag_agent.run(context)
        
        # Step 4: Run Architecture layout
        context = arch_agent.run(context)
        
        # Step 5: Run Database design
        context = db_agent.run(context)
        
        # Step 6: Run API specification
        context = api_agent.run(context)

        # Step 7: Run Cloud Service Mapping
        context = cloud_agent.run(context)
        
        # Step 8: Run Terraform compilation
        context = tf_agent.run(context)

        # Step 9: Run Security Audit
        context = sec_agent.run(context)

        # Step 9.5: Run Programmatic IaC Scan
        context = iac_scanner.run(context)

        # Step 10: Run Cost Optimization
        context = cost_agent.run(context)

        # Step 11: Run Code Validation
        context = val_agent.run(context)

        # Step 11.5: Run Programmatic Syntax Validation
        context = prog_val_agent.run(context)

        # Step 12: Run final Architecture review & scoring
        context = review_agent.run(context)

        # Step 13: Generate design documentation markdown
        context = doc_gen_agent.run(context)

        # Step 14: Save design version state to SQLite DB
        context = version_agent.run(context)

        # Step 15: Output Terraform scripts to local deployment directory
        context = deploy_agent.run(context)
        
        print("\n=== FINAL SCORECARD ===")
        print(f"Overall Quality Score: {context.review_report.overall_score:.1f}/100")
        print(f"  - Completeness:     {context.review_report.completeness:.1f}/100")
        print(f"  - Consistency:      {context.review_report.consistency:.1f}/100")
        print(f"  - Security:         {context.review_report.security:.1f}/100")
        print(f"  - Scalability:      {context.review_report.scalability:.1f}/100")
        print(f"  - Cost Efficiency:  {context.review_report.cost_efficiency:.1f}/100")
        
        print("\n=== SYSTEM REVIEW FINDINGS ===")
        for idx, finding in enumerate(context.review_report.findings):
            print(f"- {finding}")

        print("\n--- System Execution Logs ---")
        for log in context.agent_logs:
            print(f"[{log.timestamp}] {log.agent_name} - {log.status}: {log.message}")
            
    except Exception as e:
        print(f"\nExecution Failed: {str(e)}")

if __name__ == "__main__":
    test()
