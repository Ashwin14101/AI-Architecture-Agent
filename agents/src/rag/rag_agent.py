# agents/src/rag/rag_agent.py
import os
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext

class RagAgent(BaseAgent):
    def __init__(self):
        super().__init__("RAG Agent")
        
        # Load Pinecone credentials
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "architecture-standards")
        
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY is not set in environment variables.")

        # Initialize Pinecone Client
        self.pc = Pinecone(api_key=self.api_key)
        self.index = self.pc.Index(self.index_name)

        # Initialize the embedding model (loads instantly from cache)
        print("[RAG Agent] Loading sentence-transformer model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Querying Pinecone vector database for matching standards...")

        retrieved_standards = []

        try:
            for req in context.requirements:
                # 1. Generate embedding vector for the requirement text
                vector = self.model.encode(req.text).tolist()

                # 2. Query Pinecone index for the single closest matching standard
                query_result = self.index.query(
                    vector=vector,
                    top_k=1,
                    include_metadata=True
                )

                # 3. If a match is found with a strong similarity score, extract it
                if query_result.matches:
                    match = query_result.matches[0]
                    # Only accept matches with a confidence similarity score > 0.4
                    if match.score > 0.4:
                        text = match.metadata.get("text")
                        if text and text not in retrieved_standards:
                            retrieved_standards.append(text)

            # Save results into context
            context.retrieved_knowledge = retrieved_standards
            self.log_success(context, f"RAG search complete. Found {len(retrieved_standards)} matching standard policies.")
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
