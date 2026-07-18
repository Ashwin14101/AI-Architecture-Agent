
         variable "region" {
            type = string
            default = "us-east-1"
         }

         variable "ecs_instance_type" {
            type = string
            default = "t3.medium"
         }

         variable "rds_instance_type" {
            type = string
            default = "db.t3.micro"
         }

         variable "alb_instance_type" {
            type = string
            default = "Application Load Balancer"
         }
      