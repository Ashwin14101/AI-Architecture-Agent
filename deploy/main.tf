
         # Configure the AWS Provider
         provider "aws" {
            region = "us-east-1"
         }

         # Create a VPC
         resource "aws_vpc" "main" {
            cidr_block = "10.0.0.0/16"
            enable_dns_hostnames = true
            enable_dns_support   = true
            tags = {
               Name = "main-vpc"
            }
         }

         # Create a subnet for the VPC
         resource "aws_subnet" "main" {
            cidr_block = "10.0.1.0/24"
            vpc_id     = aws_vpc.main.id
            availability_zone = "us-east-1a"
            tags = {
               Name = "main-subnet"
            }
         }

         # Create a subnet group for RDS
         resource "aws_db_subnet_group" "main" {
            name       = "main-subnet-group"
            subnet_ids = [aws_subnet.main.id]
            tags = {
               Name = "main-subnet-group"
            }
         }

         # Create a security group for the VPC
         resource "aws_security_group" "main" {
            name        = "main-sg"
            description = "Allow inbound traffic"
            vpc_id      = aws_vpc.main.id

            ingress {
               description = "Allow inbound traffic"
               from_port   = 0
               to_port     = 0
               protocol    = "-1"
               cidr_blocks = ["0.0.0.0/0"]
            }

            egress {
               from_port   = 0
               to_port     = 0
               protocol    = "-1"
               cidr_blocks = ["0.0.0.0/0"]
            }

            tags = {
               Name = "main-sg"
            }
         }

         # Create an ECS cluster
         resource "aws_ecs_cluster" "main" {
            name = "main-ecs-cluster"
         }

         # Create an ECS task definition for COMP-001
         resource "aws_ecs_task_definition" "comp-001" {
            family                = "comp-001-task"
            network_mode          = "awsvpc"
            cpu                    = 1024
            memory                = 512
            requires_compatibilities = ["FARGATE"]
            execution_role_arn    = aws_iam_role.ecs_task_execution.arn
            container_definitions = jsonencode([
               {
                  name      = "comp-001-container"
                  image      = "nginx:latest"
                  cpu        = 10
                  essential = true
                  portMappings = [
                     {
                        containerPort = 80
                        hostPort      = 80
                        protocol      = "tcp"
                     }
                  ]
               }
            ])
         }

         # Create an ECS task definition for COMP-002
         resource "aws_ecs_task_definition" "comp-002" {
            family                = "comp-002-task"
            network_mode          = "awsvpc"
            cpu                    = 1024
            memory                = 512
            requires_compatibilities = ["FARGATE"]
            execution_role_arn    = aws_iam_role.ecs_task_execution.arn
            container_definitions = jsonencode([
               {
                  name      = "comp-002-container"
                  image      = "nginx:latest"
                  cpu        = 10
                  essential = true
                  portMappings = [
                     {
                        containerPort = 80
                        hostPort      = 80
                        protocol      = "tcp"
                     }
                  ]
               }
            ])
         }

         # Create an ECS service for COMP-001
         resource "aws_ecs_service" "comp-001" {
            name            = "comp-001-service"
            cluster         = aws_ecs_cluster.main.name
            task_definition = aws_ecs_task_definition.comp-001.arn
            desired_count   = 1
            launch_type      = "FARGATE"
            network_configuration {
               security_groups  = [aws_security_group.main.id]
               subnets          = [aws_subnet.main.id]
               assign_public_ip = "ENABLED"
            }
            depends_on = [aws_ecs_task_definition.comp-001]
         }

         # Create an ECS service for COMP-002
         resource "aws_ecs_service" "comp-002" {
            name            = "comp-002-service"
            cluster         = aws_ecs_cluster.main.name
            task_definition = aws_ecs_task_definition.comp-002.arn
            desired_count   = 1
            launch_type      = "FARGATE"
            network_configuration {
               security_groups  = [aws_security_group.main.id]
               subnets          = [aws_subnet.main.id]
               assign_public_ip = "ENABLED"
            }
            depends_on = [aws_ecs_task_definition.comp-002]
         }

         # Create an RDS instance for COMP-003
         resource "aws_db_instance" "comp-003" {
            allocated_storage    = 20
            engine               = "postgres"
            engine_version       = "13.4"
            instance_class       = "db.t3.micro"
            name                 = "comp-003-db"
            username             = "postgres"
            password             = "password"
            vpc_security_group_ids = [aws_security_group.main.id]
            db_subnet_group_name = aws_db_subnet_group.main.name
         }

         # Create an ElastiCache cluster for COMP-004
         resource "aws_elasticache_cluster" "comp-004" {
            cluster_id           = "comp-004-cache"
            engine               = "redis"
            node_type            = "cache.t3.micro"
            num_cache_nodes      = 1
            parameter_group_name = "default.redis6.x"
            port                 = 6379
            security_group_ids   = [aws_security_group.main.id]
            subnet_group_name    = aws_db_subnet_group.main.name
         }

         # Create an Application Load Balancer for COMP-005
         resource "aws_lb" "comp-005" {
            name               = "comp-005-alb"
            internal           = false
            load_balancer_type = "application"
            security_groups    = [aws_security_group.main.id]
            subnets            = [aws_subnet.main.id]

            tags = {
               Environment = "production"
            }
         }

         # Create a target group for the ALB
         resource "aws_lb_target_group" "comp-005" {
            name     = "comp-005-tg"
            port     = 80
            protocol = "HTTP"
            vpc_id   = aws_vpc.main.id
         }

         # Create a listener for the ALB
         resource "aws_lb_listener" "comp-005" {
            load_balancer_arn = aws_lb.comp-005.arn
            port              = "80"
            protocol          = "HTTP"

            default_action {
               target_group_arn = aws_lb_target_group.comp-005.arn
               type             = "forward"
            }
         }

         # Create an SQS queue for COMP-006
         resource "aws_sqs_queue" "comp-006" {
            name                        = "comp-006-queue"
            delay_seconds               = 90
            message_retention_period     = 86400
            receive_wait_time_seconds    = 10
            visibility_timeout_seconds = 600
         }

         # Create an S3 bucket for COMP-007
         resource "aws_s3_bucket" "comp-007" {
            bucket = "comp-007-bucket"
            acl    = "private"

            versioning {
               enabled = true
            }

            server_side_encryption_configuration {
               rule {
                  apply_server_side_encryption_by_default {
                     sse_algorithm = "AES256"
                  }
               }
            }
         }

         # Create an IAM role for ECS task execution
         resource "aws_iam_role" "ecs_task_execution" {
            name        = "ecs-task-execution"
            description = "ECS task execution role"

            assume_role_policy = jsonencode({
               Version = "2012-10-17"
               Statement = [
                  {
                     Action = "sts:AssumeRole"
                     Effect = "Allow"
                     Principal = {
                        Service = "ecs-tasks.amazonaws.com"
                     }
                  }
               ]
            })
         }

         # Create an IAM policy for ECS task execution
         resource "aws_iam_policy" "ecs_task_execution" {
            name        = "ecs-task-execution"
            description = "ECS task execution policy"

            policy = jsonencode({
               Version = "2012-10-17"
               Statement = [
                  {
                     Action = [
                        "ec2:Describe*",
                        "elasticloadbalancing:Describe*",
                        "cloudwatch:Describe*",
                        "cloudwatch:GetMetricStatistics"
                     ]
                     Effect = "Allow"
                     Resource = "*"
                  }
               ]
            })
         }

         # Attach the IAM policy to the IAM role
         resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
            role       = aws_iam_role.ecs_task_execution.name
            policy_arn = aws_iam_policy.ecs_task_execution.arn
         }
      