
         variable 'region' {
           type        = string
           default     = 'us-east-1'
           description = 'The AWS region to deploy to'
         }

         variable 'vpc_cidr' {
           type        = string
           default     = '10.0.0.0/16'
           description = 'The CIDR block for the VPC'
         }

         variable 'public_subnet_cidr' {
           type        = string
           default     = '10.0.1.0/24'
           description = 'The CIDR block for the public subnet'
         }

         variable 'private_subnet_cidr' {
           type        = string
           default     = '10.0.2.0/24'
           description = 'The CIDR block for the private subnet'
         }

         variable 'db_username' {
           type        = string
           default     = 'postgres'
           description = 'The username for the RDS instance'
         }

         variable 'db_password' {
           type        = string
           default     = 'password'
           description = 'The password for the RDS instance'
         }

         variable 'db_instance_class' {
           type        = string
           default     = 'db.t3.micro'
           description = 'The instance class for the RDS instance'
         }
      