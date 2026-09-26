
         output "ecs_cluster_name" {
            value       = aws_ecs_cluster.main.name
            description = "ECS cluster name"
         }

         output "ecs_task_definition_arn_comp-001" {
            value       = aws_ecs_task_definition.comp-001.arn
            description = "ECS task definition ARN for COMP-001"
         }

         output "ecs_task_definition_arn_comp-002" {
            value       = aws_ecs_task_definition.comp-002.arn
            description = "ECS task definition ARN for COMP-002"
         }

         output "rds_instance_endpoint" {
            value       = aws_db_instance.comp-003.endpoint
            description = "RDS instance endpoint"
         }

         output "elasticache_cluster_endpoint" {
            value       = aws_elasticache_cluster.comp-004.cache_nodes[0].address
            description = "ElastiCache cluster endpoint"
         }

         output "alb_dns_name" {
            value       = aws_lb.comp-005.dns_name
            description = "ALB DNS name"
         }

         output "sqs_queue_url" {
            value       = aws_sqs_queue.comp-006.id
            description = "SQS queue URL"
         }

         output "s3_bucket_name" {
            value       = aws_s3_bucket.comp-007.id
            description = "S3 bucket name"
         }
      