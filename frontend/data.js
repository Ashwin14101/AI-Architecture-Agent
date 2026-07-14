// Mock data for the Frontend AI Architecture application

const INITIAL_BOARDS = [
  {
    id: "aws-ecommerce",
    name: "AWS E-Commerce Platform",
    category: "Teams",
    teamName: "Core Dev Team",
    updatedAt: "2 hours ago",
    nodes: [
      { id: "api-gateway", name: "AWS API Gateway", type: "gateway", status: "Active" },
      { id: "auth-cognito", name: "Cognito Auth Service", type: "security", status: "Active" },
      { id: "users-lambda", name: "Users Microservice (Lambda)", type: "compute", status: "Active" },
      { id: "users-db", name: "Users Database (DynamoDB)", type: "database", status: "Active" }
    ]
  },
  {
    id: "analytics-pipeline",
    name: "Real-time Analytics Pipeline",
    category: "Teams",
    teamName: "Data Platform Team",
    updatedAt: "1 day ago",
    nodes: [
      { id: "kinesis-stream", name: "Kinesis Data Stream", type: "streaming", status: "Active" },
      { id: "process-lambda", name: "Analytics Processor (Lambda)", type: "compute", status: "Active" },
      { id: "s3-lake", name: "Data Lake (S3)", type: "storage", status: "Active" }
    ]
  },
  {
    id: "serverless-chat",
    name: "Serverless Chat Application",
    category: "Private",
    updatedAt: "3 days ago",
    nodes: [
      { id: "ws-gateway", name: "WebSocket API Gateway", type: "gateway", status: "Active" },
      { id: "chat-lambda", name: "Chat Handler (Lambda)", type: "compute", status: "Active" },
      { id: "chat-db", name: "Messages DB (DynamoDB)", type: "database", status: "Active" }
    ]
  },
  {
    id: "multi-region-sql",
    name: "Multi-Region SQL Cluster",
    category: "Private",
    updatedAt: "1 week ago",
    nodes: [
      { id: "route53", name: "Route 53 Global Routing", type: "gateway", status: "Active" },
      { id: "rds-primary", name: "Aurora Postgres (Primary)", type: "database", status: "Active" },
      { id: "rds-replica", name: "Aurora Postgres (Replica)", type: "database", status: "Active" }
    ]
  }
];

const AI_PROMPTS = {
  "design-aws-backend": `### AWS Serverless Backend Design

Here is the proposed serverless architecture optimized for scalability, security, and developer velocity.

#### Architecture Components:
1. **API Gateway (REST API)**: Entry point for client requests. Handles CORS, SSL offloading, and rate limiting.
2. **Cognito User Pool**: Managed user authentication, handling JWT token issuance and verification.
3. **Lambda Compute**: Event-driven Node.js 20.x functions implementing business logic.
4. **DynamoDB Database**: Single-table design for sub-10ms operational queries.

\`\`\`hcl
# Infrastructure outline (Terraform)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "serverless-backend-api"
  protocol_type = "HTTP"
}
\`\`\`

Would you like me to deploy these nodes directly to your active canvas?`,

  "optimize-cost": `### Cost Optimization Strategy

Analysis of the current AWS Architecture reveals several areas to reduce waste:

#### Recommendations:
1. **API Gateway**: Switch from REST APIs to HTTP APIs where advanced routing isn't needed. This reduces API Gateway costs by **~70%**.
2. **DynamoDB**: Toggle infrequently accessed tables to **On-Demand Capacity Mode**. For highly predictable traffic patterns, use **Provisioned Capacity with Auto-scaling** or purchase Reserved Capacity.
3. **Lambda Execution**: Analyze execution logs. Reduce memory allocations where functions use less than 25% of memory; memory scales CPU proportionally, but over-allocating wastes budget.
4. **S3 Storage Tiering**: Enable **S3 Intelligent-Tiering** to automatically move files to cheaper archive tiers after 30 days.

*Estimated Monthly Savings: **32%** of current infrastructure spend.*`,

  "security-review": `### Architecture Security Review

I've analyzed your current architecture configuration. Here are the key findings:

#### ⚠️ Medium Priority Issues:
1. **API Gateway**: Ensure rate limiting is configured (current: no throttle set). Recommended: 1000 req/s burst limit.
2. **Lambda Functions**: Functions should use the **principle of least privilege** — audit IAM role permissions to remove any \`*\` wildcards.
3. **DynamoDB**: Enable **encryption at rest** using AWS-managed CMK. Enable **point-in-time recovery** for all production tables.

#### ✅ Good Security Practices Found:
- Cognito JWT authorizers are correctly attached to all protected routes
- VPC Endpoints are isolated per service boundary
- S3 bucket policies block public access by default

#### 🔧 Recommended Actions:
- Enable **AWS WAF** in front of your API Gateway for OWASP Top 10 protection
- Rotate **Cognito app client secrets** every 90 days
- Add **CloudTrail** logging for API call audit trails

*Risk score: Medium (4/10) — Generally secure, some hardening needed.*`,

  "default": `I'm ready to assist you. Here are some options:
- Ask me to **Design AWS backend** (click the quick prompt button below).
- Ask me to **Optimize Cost** (click the cost optimization button below).
- Type a custom architecture question in the input box below.`
};

const AGENT_DETAILS = {
  "api-gateway": {
    name: "AWS API Gateway",
    overview: {
      description: "Fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. Acts as the front door for application access.",
      status: "Active",
      technology: "AWS API Gateway (HTTP API)",
      version: "v1.4.0",
      region: "us-east-1",
      connections: "Cognito Auth Service, Users Microservice (Lambda)"
    },
    routes: [
      { method: "GET", path: "/users", description: "Fetch a list of user profiles with optional pagination filter.", auth: "Cognito" },
      { method: "POST", path: "/users", description: "Create a new user profile. Requires JSON payload.", auth: "Cognito" },
      { method: "GET", path: "/users/{id}", description: "Retrieve detailed profile for a single user by ID.", auth: "None" },
      { method: "DELETE", path: "/users/{id}", description: "Soft-deletes a user profile and flags records.", auth: "Cognito Admin" }
    ],
    terraform: `resource "aws_apigatewayv2_api" "http_gateway" {
  name          = "gateway-api"
  protocol_type = "HTTP"
  target        = aws_lambda_function.users_lambda.arn
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_gateway.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format          = "$context.identity.sourceIp - - [$context.requestTime] \\"$context.httpMethod $context.routeKey $context.protocol\\" $context.status"
  }
}

resource "aws_apigatewayv2_authorizer" "cognito_auth" {
  api_id           = aws_apigatewayv2_api.http_gateway.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.client.id]
    issuer   = "https://\${aws_cognito_user_pool.pool.endpoint}"
  }
}`
  },
  "auth-cognito": {
    name: "Cognito Auth Service",
    overview: {
      description: "Provides authentication, authorization, and user management for web and mobile apps. Handles logins, registration, MFA, and federated identity providers.",
      status: "Active",
      technology: "Amazon Cognito User Pools",
      version: "v2.1.2",
      region: "us-east-1",
      connections: "AWS API Gateway"
    },
    routes: [
      { method: "POST", path: "/auth/signup", description: "Register a new account. Sends verification code to email.", auth: "None" },
      { method: "POST", path: "/auth/login", description: "Exchange credentials (email/password) for JWT Tokens (ID, Access, Refresh).", auth: "None" },
      { method: "POST", path: "/auth/confirm", description: "Submit verification code to finalize account registration.", auth: "None" },
      { method: "POST", path: "/auth/mfa", description: "Validate multi-factor authentication token.", auth: "None" }
    ],
    terraform: `resource "aws_cognito_user_pool" "pool" {
  name = "user-auth-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}."
    email_subject        = "Verify your account"
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "app-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}`
  },
  "users-lambda": {
    name: "Users Microservice (Lambda)",
    overview: {
      description: "Serverless function that processes users business logic. Triggered by API Gateway events, queries DynamoDB, and formats JSON responses.",
      status: "Active",
      technology: "AWS Lambda (Node.js 20.x)",
      version: "v1.0.8",
      region: "us-east-1",
      connections: "AWS API Gateway, Users Database (DynamoDB)"
    },
    routes: [
      { method: "Trigger", path: "apigw -> users-lambda", description: "Event wrapper parsed in index.handler to route logic.", auth: "Internal" }
    ],
    terraform: `resource "aws_lambda_function" "users_microservice" {
  filename      = "users_lambda.zip"
  function_name = "users-handler"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.users_table.name
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "users-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}`
  },
  "users-db": {
    name: "Users Database (DynamoDB)",
    overview: {
      description: "NoSQL document database providing key-value and document data structures. Low latency queries, automatic scaling, and point-in-time recovery support.",
      status: "Active",
      technology: "AWS DynamoDB",
      version: "On-Demand",
      region: "us-east-1",
      connections: "Users Microservice (Lambda)"
    },
    routes: [
      { method: "Query", path: "GetItem (PK=USER#id)", description: "Retrieve user metadata by primary key.", auth: "IAM Role" },
      { method: "Query", path: "PutItem", description: "Writes new user row or updates existing attributes.", auth: "IAM Role" }
    ],
    terraform: `resource "aws_dynamodb_table" "users_table" {
  name         = "users-db-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = "production"
    Service     = "user-microservice"
  }
}`
  }
};
