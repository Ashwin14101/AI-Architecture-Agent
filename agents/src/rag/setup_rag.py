# agents/setup_rag.py

import os
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

# Sample company standards to upload
STANDARDS = [
    "AWS Database Standard: All relational databases must run on AWS RDS. Use encrypted storage at rest (KMS key encryption).",
    "AWS Host Standard: Public-facing web servers must run on ECS Fargate behind an Application Load Balancer (ALB). Do not expose direct EC2 instances.",
    "AWS Messaging Standard: Use SQS for asynchronous queueing and SNS for event broadcasting to decoupled microservices.",
    "Cost Standard: For projects with a monthly budget under $300, choose Serverless database tiers (like DynamoDB or Aurora Serverless v2) and small compute sizes (t3.micro).",
    "Security Standard: All user passwords must be hashed using bcrypt or argon2 before database write."
]

def setup():
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "architecture-standards")
    
    if not api_key:
        print("Error: PINECONE_API_KEY not found in .env")
        return

    # Initialize Pinecone
    pc = Pinecone(api_key=api_key)

    # 1. Create Pinecone Index if it doesn't exist
    if index_name not in pc.list_indexes().names():
        print(f"Creating Pinecone index '{index_name}'...")
        pc.create_index(
            name=index_name,
            dimension=384, # Dimension of 'all-MiniLM-L6-v2' model
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    else:
        print(f"Index '{index_name}' already exists.")

    index = pc.Index(index_name)

    # 2. Generate local embeddings and upload
    print("Generating embeddings using local sentence-transformer model (free)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    vectors = []
    for i, text in enumerate(STANDARDS):
        embedding = model.encode(text).tolist()
        vectors.append({
            "id": f"std-{i}",
            "values": embedding,
            "metadata": {"text": text}
        })

    print(f"Uploading {len(vectors)} standards vectors to Pinecone...")
    index.upsert(vectors=vectors)
    print("Vector database populated successfully!")

if __name__ == "__main__":
    setup()
