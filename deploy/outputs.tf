
         output 'load_balancer_url' {
           value = aws_lb.main.dns_name
           description = 'The URL of the load balancer'
         }

         output 'database_endpoint' {
           value = aws_db_instance.main.endpoint
           description = 'The endpoint of the RDS instance'
         }

         output 'database_username' {
           value = aws_db_instance.main.username
           description = 'The username of the RDS instance'
         }

         output 'database_password' {
           value = aws_db_instance.main.password
           description = 'The password of the RDS instance'
           sensitive = true
         }
      