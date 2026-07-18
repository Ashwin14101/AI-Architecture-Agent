
         # Configure the AWS Provider
         provider "aws" {
            region = "us-east-1"
         }

         # Create a VPC
         resource "aws_vpc" "main" {
            cidr_block = "10.0.0.0/16"
            enable_dns_support = true
            enable_dns_hostnames = true
            tags = {
               Name = "main-vpc"
            }
         }

         # Create a subnet for the ECS cluster
         resource "aws_subnet" "ecs" {
            cidr_block = "10.0.1.0/24"
            vpc_id = aws_vpc.main.id
            availability_zone = "us-east-1a"
            tags = {
               Name = "ecs-subnet"
            }
         }

         # Create a subnet for the RDS instance
         resource "aws_subnet" "rds" {
            cidr_block = "10.0.2.0/24"
            vpc_id = aws_vpc.main.id
            availability_zone = "us-east-1a"
            tags = {
               Name = "rds-subnet"
            }
         }

         # Create a security group for the ECS cluster
         resource "aws_security_group" "ecs" {
            name = "ecs-sg"
            description = "Allow inbound access to the ECS cluster"
            vpc_id = aws_vpc.main.id

            ingress {
               protocol = "tcp"
               from_port = 80
               to_port = 80
               cidr_blocks = ["0.0.0.0/0"]
            }

            egress {
               protocol = "-1"
               from_port = 0
               to_port = 0
               cidr_blocks = ["0.0.0.0/0"]
            }

            tags = {
               Name = "ecs-sg"
            }
         }

         # Create a security group for the RDS instance
         resource "aws_security_group" "rds" {
            name = "rds-sg"
            description = "Allow inbound access to the RDS instance"
            vpc_id = aws_vpc.main.id

            ingress {
               protocol = "tcp"
               from_port = 5432
               to_port = 5432
               security_groups = [aws_security_group.ecs.id]
            }

            tags = {
               Name = "rds-sg"
            }
         }

         # Create an ECS cluster
         resource "aws_ecs_cluster" "main" {
            name = "main-ecs-cluster"
         }

         # Create an ECS task definition for COMP-001
         resource "aws_ecs_task_definition" "comp_001" {
            family = "comp-001-task"
            cpu = "1024"
            memory = "512"
            network_mode = "awsvpc"
            requires_compatibilities = ["FARGATE"]
            execution_role_arn = aws_iam_role.ecs_task_execution.arn
            container_definitions = jsonencode([
               {
                  name = "comp-001-container"
                  image = "nginx:latest"
                  cpu = 10
                  essential = true
                  portMappings = [
                     {
                        containerPort = 80
                        hostPort = 80
                        protocol = "tcp"
                     }
                  ]
               }
            ])
         }

         # Create an ECS task definition for COMP-002
         resource "aws_ecs_task_definition" "comp_002" {
            family = "comp-002-task"
            cpu = "1024"
            memory = "512"
            network_mode = "awsvpc"
            requires_compatibilities = ["FARGATE"]
            execution_role_arn = aws_iam_role.ecs_task_execution.arn
            container_definitions = jsonencode([
               {
                  name = "comp-002-container"
                  image = "nginx:latest"
                  cpu = 10
                  essential = true
                  portMappings = [
                     {
                        containerPort = 80
                        hostPort = 80
                        protocol = "tcp"
                     }
                  ]
               }
            ])
         }

         # Create an ECS service for COMP-001
         resource "aws_ecs_service" "comp_001" {
            name = "comp-001-service"
            cluster = aws_ecs_cluster.main.name
            task_definition = aws_ecs_task_definition.comp_001.arn
            desired_count = 1
            launch_type = "FARGATE"
            network_configuration {
               subnets = [aws_subnet.ecs.id]
               security_groups = [aws_security_group.ecs.id]
               assign_public_ip = "ENABLED"
            }
         }

         # Create an ECS service for COMP-002
         resource "aws_ecs_service" "comp_002" {
            name = "comp-002-service"
            cluster = aws_ecs_cluster.main.name
            task_definition = aws_ecs_task_definition.comp_002.arn
            desired_count = 1
            launch_type = "FARGATE"
            network_configuration {
               subnets = [aws_subnet.ecs.id]
               security_groups = [aws_security_group.ecs.id]
               assign_public_ip = "ENABLED"
            }
         }

         # Create an RDS instance for COMP-003
         resource "aws_db_instance" "comp_003" {
            allocated_storage = 20
            engine = "postgres"
            engine_version = "13.4"
            instance_class = "db.t3.micro"
            name = "comp003db"
            username = "postgres"
            password = "password"
            vpc_security_group_ids = [aws_security_group.rds.id]
            db_subnet_group_name = aws_db_subnet_group.main.name
         }

         # Create a DB subnet group
         resource "aws_db_subnet_group" "main" {
            name = "main-db-subnet-group"
            subnet_ids = [aws_subnet.rds.id]
         }

         # Create an Application Load Balancer for COMP-004
         resource "aws_alb" "comp_004" {
            name = "comp-004-alb"
            subnets = [aws_subnet.ecs.id]
            security_groups = [aws_security_group.ecs.id]
         }

         # Create a target group for the ALB
         resource "aws_alb_target_group" "comp_004" {
            name = "comp-004-target-group"
            port = 80
            protocol = "HTTP"
            vpc_id = aws_vpc.main.id
         }

         # Create a listener for the ALB
         resource "aws_alb_listener" "comp_004" {
            load_balancer_arn = aws_alb.comp_004.arn
            port = 80
            protocol = "HTTP"

            default_action {
               target_group_arn = aws_alb_target_group.comp_004.arn
               type = "forward"
            }
         }

         # Create an IAM role for the ECS task execution
         resource "aws_iam_role" "ecs_task_execution" {
            name = "ecs-task-execution"
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

         # Create an IAM policy for the ECS task execution
         resource "aws_iam_policy" "ecs_task_execution" {
            name = "ecs-task-execution"
            policy = jsonencode({
               Version = "2012-10-17"
               Statement = [
                  {
                     Action = [
                        "ecr:GetAuthorizationToken",
                        "ecr:BatchGetImage",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchCheckLayerAvailability",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                     ]
                     Effect = "Allow"
                     Resource = "*"
                  }
               ]
            })
         }

         # Attach the IAM policy to the IAM role
         resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
            role = aws_iam_role.ecs_task_execution.name
            policy_arn = aws_iam_policy.ecs_task_execution.arn
         }
      