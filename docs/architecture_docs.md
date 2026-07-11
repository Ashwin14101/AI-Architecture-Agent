# CloudStore E-commerce Portal Architecture Documentation
## Project Executive Summary & Creators
The CloudStore E-commerce Portal is a scalable and secure online platform designed to provide a seamless user experience for customers to browse and purchase products. This project was created by a team of experienced developers and technical writers, with the goal of delivering a high-quality e-commerce solution.

## Functional & Non-Functional Requirements Checklist
The following requirements have been identified for the CloudStore E-commerce Portal:
* **Functional Requirements:**
	+ [REQ-001]: The system shall have a database to store users and product catalog
	+ [REQ-002]: The system shall provide user registration functionality
	+ [REQ-003]: The system shall provide user login functionality
* **Non-Functional Requirements:**
	+ [REQ-004]: The system shall be highly scalable
	+ [REQ-008]: The system shall load in under 2 seconds
* **Constraints:**
	+ [REQ-005]: The system shall be deployed on AWS
* **Technical Requirements:**
	+ [REQ-006]: The frontend of the system shall be built using React
	+ [REQ-007]: The backend of the system shall be built using Node.js
* **Security Requirements:**
	+ [REQ-009]: The system shall hash passwords for security
* **Business Rules:**
	+ [REQ-010]: The system shall have an estimated monthly budget of $200

## Logical Component Architecture & Patterns Applied
The CloudStore E-commerce Portal consists of the following logical components:
* [COMP-001]: Web Server (Type: web-server) - Handles user requests and serves the React frontend
* [COMP-002]: Application Load Balancer (Type: load-balancer) - Distributes incoming traffic to the web servers
* [COMP-003]: API Server (Type: web-server) - Handles API requests from the frontend and interacts with the database
* [COMP-004]: Database Server (Type: database) - Stores user and product catalog data

## Database Design
The CloudStore E-commerce Portal uses a PostgreSQL database engine, with the following tables:
* **users**: stores user information
* **products**: stores product catalog data
* **sessions**: stores session information for logged-in users
The database schema relationships are as follows:
* A user can have many sessions (one-to-many)
* A product can have many orders (one-to-many)

## REST API Specifications & Routing Map
The CloudStore E-commerce Portal provides the following REST endpoints:
* **POST /api/register**: creates a new user account
* **POST /api/login**: logs in an existing user
* **GET /api/products**: retrieves a list of all products
* **GET /api/products/:id**: retrieves a single product by ID
* **POST /api/products**: creates a new product
* **PUT /api/products/:id**: updates an existing product
* **DELETE /api/products/:id**: deletes a product

## Physical Cloud Topology, Service mappings, and Cost estimates
The CloudStore E-commerce Portal is deployed on AWS, with the following physical cloud topology:
* Web Server: Amazon EC2
* Application Load Balancer: Amazon ELB
* API Server: Amazon EC2
* Database Server: Amazon RDS
The estimated monthly cost for the CloudStore E-commerce Portal is $63.25, which is within the budget of $200.

## Operations Runbook
To deploy the CloudStore E-commerce Portal using Terraform, follow these steps:
* Initialize the Terraform working directory
* Configure the AWS provider
* Create the Amazon EC2 instances for the web server and API server
* Create the Amazon ELB for the application load balancer
* Create the Amazon RDS instance for the database server
* Configure the security groups and networking rules
* Apply the Terraform configuration to deploy the infrastructure
Note: The detailed Terraform configuration files are not included in this document, but can be provided separately.