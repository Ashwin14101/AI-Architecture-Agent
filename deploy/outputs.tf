
         output "ecs_instance_id" {
            value = aws_ecs_service.comp_001.id
         }

         output "rds_instance_endpoint" {
            value = aws_db_instance.comp_003.endpoint
         }

         output "alb_dns_name" {
            value = aws_alb.comp_004.dns_name
         }
      