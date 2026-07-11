
         # Configure the AWS Provider
         provider 'aws' {
           region = 'us-east-1'
         }

         # Create a VPC
         resource 'aws_vpc' 'main' {
           cidr_block = '10.0.0.0/16'
           enable_dns_hostnames = true
           enable_dns_support   = true
           tags = {
             Name = 'main-vpc'
           }
         }

         # Create a subnet for the load balancer
         resource 'aws_subnet' 'public' {
           cidr_block = '10.0.1.0/24'
           vpc_id     = aws_vpc.main.id
           availability_zone = 'us-east-1a'
           tags = {
             Name = 'public-subnet'
           }
         }

         # Create a subnet for the database
         resource 'aws_subnet' 'private' {
           cidr_block = '10.0.2.0/24'
           vpc_id     = aws_vpc.main.id
           availability_zone = 'us-east-1a'
           tags = {
             Name = 'private-subnet'
           }
         }

         # Create a security group for the load balancer
         resource 'aws_security_group' 'lb' {
           name        = 'lb-sg'
           description = 'Security group for the load balancer'
           vpc_id      = aws_vpc.main.id

           ingress {
             from_port   = 80
             to_port     = 80
             protocol    = 'tcp'
             cidr_blocks = ['0.0.0.0/0']
           }

           egress {
             from_port   = 0
             to_port     = 0
             protocol    = '-1'
             cidr_blocks = ['0.0.0.0/0']
           }
         }

         # Create a security group for the database
         resource 'aws_security_group' 'db' {
           name        = 'db-sg'
           description = 'Security group for the database'
           vpc_id      = aws_vpc.main.id

           ingress {
             from_port   = 5432
             to_port     = 5432
             protocol    = 'tcp'
             cidr_blocks = [aws_vpc.main.cidr_block]
           }

           egress {
             from_port   = 0
             to_port     = 0
             protocol    = '-1'
             cidr_blocks = ['0.0.0.0/0']
           }
         }

         # Create an ECS cluster
         resource 'aws_ecs_cluster' 'main' {
           name = 'main-cluster'
         }

         # Create an ECS task definition for COMP-001
         resource 'aws_ecs_task_definition' 'comp-001' {
           family                = 'comp-001'
           cpu                    = 1024
           memory                = 512
           network_mode          = 'awsvpc'
           requires_compatibilities = ['FARGATE']
           cpu_architecture       = 'X86_64'
           execution_role_arn     = aws_iam_role.ecs_task_execution.arn
           container_definitions = jsonencode([
             {
               name      = 'comp-001'
               image      = 'amazonlinux'
               cpu        = 10
               essential = true
               portMappings = [
                 {
                   containerPort = 80
                   hostPort      = 80
                   protocol      = 'tcp'
                 }
               ]
             }
           ])
         }

         # Create an ECS task definition for COMP-003
         resource 'aws_ecs_task_definition' 'comp-003' {
           family                = 'comp-003'
           cpu                    = 256
           memory                = 512
           network_mode          = 'awsvpc'
           requires_compatibilities = ['FARGATE']
           cpu_architecture       = 'X86_64'
           execution_role_arn     = aws_iam_role.ecs_task_execution.arn
           container_definitions = jsonencode([
             {
               name      = 'comp-003'
               image      = 'amazonlinux'
               cpu        = 10
               essential = true
               portMappings = [
                 {
                   containerPort = 80
                   hostPort      = 80
                   protocol      = 'tcp'
                 }
               ]
             }
           ])
         }

         # Create an ECS service for COMP-001
         resource 'aws_ecs_service' 'comp-001' {
           name            = 'comp-001'
           cluster         = aws_ecs_cluster.main.name
           task_definition = aws_ecs_task_definition.comp-001.arn
           desired_count    = 1
           launch_type      = 'FARGATE'
           network_configuration {
             subnets          = [aws_subnet.public.id]
             security_groups  = [aws_security_group.lb.id]
             assign_public_ip = 'ENABLED'
           }
         }

         # Create an ECS service for COMP-003
         resource 'aws_ecs_service' 'comp-003' {
           name            = 'comp-003'
           cluster         = aws_ecs_cluster.main.name
           task_definition = aws_ecs_task_definition.comp-003.arn
           desired_count    = 1
           launch_type      = 'FARGATE'
           network_configuration {
             subnets          = [aws_subnet.public.id]
             security_groups  = [aws_security_group.lb.id]
             assign_public_ip = 'ENABLED'
           }
         }

         # Create an Application Load Balancer
         resource 'aws_lb' 'main' {
           name               = 'main-lb'
           internal           = false
           load_balancer_type = 'application'
           security_groups    = [aws_security_group.lb.id]
           subnets            = [aws_subnet.public.id]

           enable_deletion_protection = false
         }

         # Create a target group for COMP-001
         resource 'aws_lb_target_group' 'comp-001' {
           name     = 'comp-001'
           port     = 80
           protocol = 'HTTP'
           vpc_id   = aws_vpc.main.id
         }

         # Create a target group for COMP-003
         resource 'aws_lb_target_group' 'comp-003' {
           name     = 'comp-003'
           port     = 80
           protocol = 'HTTP'
           vpc_id   = aws_vpc.main.id
         }

         # Create a listener for the load balancer
         resource 'aws_lb_listener' 'main' {
           load_balancer_arn = aws_lb.main.arn
           port              = '80'
           protocol          = 'HTTP'

           default_action {
             type             = 'forward'
             target_group_arn = aws_lb_target_group.comp-001.arn
           }
         }

         # Create a listener rule for COMP-001
         resource 'aws_lb_listener_rule' 'comp-001' {
           listener_arn = aws_lb_listener.main.arn
           priority     = 1

           action {
             type             = 'forward'
             target_group_arn = aws_lb_target_group.comp-001.arn
           }

           condition {
             path_pattern {
               values = ['/comp-001/*']
             }
           }
         }

         # Create a listener rule for COMP-003
         resource 'aws_lb_listener_rule' 'comp-003' {
           listener_arn = aws_lb_listener.main.arn
           priority     = 2

           action {
             type             = 'forward'
             target_group_arn = aws_lb_target_group.comp-003.arn
           }

           condition {
             path_pattern {
               values = ['/comp-003/*']
             }
           }
         }

         # Create an RDS instance
         resource 'aws_db_instance' 'main' {
           allocated_storage    = 20
           engine               = 'postgres'
           engine_version       = '13.4'
           instance_class       = 'db.t3.micro'
           name                 = 'maindb'
           username             = 'postgres'
           password             = 'password'
           vpc_security_group_ids = [aws_security_group.db.id]
           db_subnet_group_name = aws_db_subnet_group.main.name
         }

         # Create a DB subnet group
         resource 'aws_db_subnet_group' 'main' {
           name       = 'main'
           subnet_ids = [aws_subnet.private.id]
         }

         # Create an IAM role for the ECS task execution
         resource 'aws_iam_role' 'ecs_task_execution' {
           name        = 'ecs-task-execution'
           description = 'ECS task execution role'

           assume_role_policy = jsonencode({
             Version = '2012-10-17'
             Statement = [
               {
                 Action = 'sts:AssumeRole'
                 Principal = {
                   Service = 'ecs-tasks.amazonaws.com'
                 }
                 Effect = 'Allow'
                 Sid      = ''
               }
             ]
           })
         }

         # Create an IAM policy for the ECS task execution
         resource 'aws_iam_policy' 'ecs_task_execution' {
           name        = 'ecs-task-execution'
           description = 'ECS task execution policy'

           policy = jsonencode({
             Version = '2012-10-17'
             Statement = [
               {
                 Action = [
                   'ecr:GetAuthorizationToken',
                   'ecr:BatchGetImage',
                   'ecr:GetDownloadUrlForLayer',
                   'ecr:BatchCheckLayerAvailability',
                   'logs:CreateLogStream',
                   'logs:PutLogEvents'
                 ]
                 Resource = '*'
                 Effect    = 'Allow'
               }
             ]
           })
         }

         # Attach the IAM policy to the IAM role
         resource 'aws_iam_role_policy_attachment' 'ecs_task_execution' {
           role       = aws_iam_role.ecs_task_execution.name
           policy_arn = aws_iam_policy.ecs_task_execution.arn
         }
      