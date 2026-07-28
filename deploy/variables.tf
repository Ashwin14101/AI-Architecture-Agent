
         variable "aws_region" {
            type        = string
            default     = "us-east-1"
            description = "AWS region"
         }

         variable "aws_availability_zone" {
            type        = string
            default     = "us-east-1a"
            description = "AWS availability zone"
         }

         variable "ecs_task_cpu" {
            type        = number
            default     = 1024
            description = "ECS task CPU"
         }

         variable "ecs_task_memory" {
            type        = number
            default     = 512
            description = "ECS task memory"
         }

         variable "rds_instance_class" {
            type        = string
            default     = "db.t3.micro"
            description = "RDS instance class"
         }

         variable "elasticache_node_type" {
            type        = string
            default     = "cache.t3.micro"
            description = "ElastiCache node type"
         }

         variable "alb_security_group_id" {
            type        = string
            description = "ALB security group ID"
         }

         variable "alb_subnet_id" {
            type        = string
            description = "ALB subnet ID"
         }
      