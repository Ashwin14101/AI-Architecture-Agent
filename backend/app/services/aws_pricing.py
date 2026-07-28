# AWS Pricing Service
# Maps component types to real AWS pricing
import boto3
import os
from functools import lru_cache

# Fallback pricing table (when AWS API not available / no credentials)
FALLBACK_PRICING = {
    'ec2_t3_micro': 8.47,
    'ec2_t3_small': 16.94,
    'ec2_t3_medium': 33.87,
    'rds_t3_micro': 15.33,
    'rds_t3_small': 28.34,
    's3_standard': 2.30,
    'elasticache_t3_micro': 12.41,
    'alb': 18.25,
    'lambda': 0.20,
    'api_gateway': 3.50,
    'cloudfront': 1.00,
    'sqs': 0.40,
    'sns': 0.50,
    'ecs_fargate': 12.00,
    'eks': 72.00,
}

COMPONENT_TYPE_MAP = {
    'web-server': 'ec2_t3_small',
    'Microservice': 'ecs_fargate',
    'API Gateway': 'api_gateway',
    'load-balancer': 'alb',
    'database': 'rds_t3_micro',
    'Database': 'rds_t3_micro',
    'cache': 'elasticache_t3_micro',
    'Cache': 'elasticache_t3_micro',
    'storage': 's3_standard',
    'Storage': 's3_standard',
    'queue': 'sqs',
    'Queue': 'sqs',
    'cdn': 'cloudfront',
    'CDN': 'cloudfront',
    'serverless': 'lambda',
    'Lambda': 'lambda',
    'container': 'ecs_fargate',
    'Container': 'ecs_fargate',
}

def get_component_cost(component_type: str, component_name: str = '') -> float:
    """Get monthly cost estimate for a component type."""
    # Try AWS Pricing API first
    try:
        return _get_aws_price(component_type, component_name)
    except Exception:
        # Fall back to static table
        key = COMPONENT_TYPE_MAP.get(component_type) or COMPONENT_TYPE_MAP.get(component_name.split()[0] if component_name else '')
        if key:
            return FALLBACK_PRICING.get(key, 10.0)
        return 10.0  # Default $10/mo

def _get_aws_price(component_type: str, component_name: str = '') -> float:
    """Query real AWS Pricing API."""
    import boto3
    client = boto3.client('pricing', region_name='us-east-1')
    
    # Map to AWS service
    aws_type = COMPONENT_TYPE_MAP.get(component_type, 'ec2_t3_small')
    
    if 'ec2' in aws_type or aws_type in ('alb', 'ecs_fargate'):
        # Query EC2 pricing
        response = client.get_products(
            ServiceCode='AmazonEC2',
            Filters=[
                {'Type': 'TERM_MATCH', 'Field': 'instanceType', 'Value': 't3.small'},
                {'Type': 'TERM_MATCH', 'Field': 'operatingSystem', 'Value': 'Linux'},
                {'Type': 'TERM_MATCH', 'Field': 'location', 'Value': 'US East (N. Virginia)'},
                {'Type': 'TERM_MATCH', 'Field': 'tenancy', 'Value': 'Shared'},
                {'Type': 'TERM_MATCH', 'Field': 'capacitystatus', 'Value': 'Used'},
            ],
            MaxResults=1
        )
        if response['PriceList']:
            import json
            price_data = json.loads(response['PriceList'][0])
            terms = price_data.get('terms', {}).get('OnDemand', {})
            for term in terms.values():
                for dim in term.get('priceDimensions', {}).values():
                    hourly = float(dim.get('pricePerUnit', {}).get('USD', 0))
                    return round(hourly * 730, 2)  # Monthly
    
    raise ValueError('No price found')

def estimate_architecture_costs(components: list) -> dict:
    """Estimate costs for all components in an architecture."""
    results = []
    total = 0.0
    
    for comp in components:
        cost = get_component_cost(
            comp.get('type', 'Microservice'),
            comp.get('name', '')
        )
        results.append({
            'component_id': comp.get('id', ''),
            'component_name': comp.get('name', ''),
            'component_type': comp.get('type', ''),
            'monthly_cost_usd': cost,
        })
        total += cost
    
    return {
        'per_component': results,
        'total_monthly_usd': round(total, 2),
        'currency': 'USD',
        'pricing_source': 'AWS Pricing API (with fallback)',
    }
