import json
import boto3
import os
import re

def handler(event, context):
    """Lambda function to selectively invalidate CloudFront cache after deployment"""

    distribution_id = os.environ['DISTRIBUTION_ID']
    client = boto3.client('cloudfront')

    try:
        # Check if this is a hash-based deployment
        detail = event.get('detail', {})
        artifact = detail.get('artifact', '')

        # Extract changed files from CodePipeline artifact
        # For now, we'll assume hash-based filenames and only invalidate unhashed resources
        paths_to_invalidate = [
            '/index.html',      # Always invalidate index
            '/service-worker.js',  # Service worker needs invalidation
            '/manifest.json',    # Manifest needs invalidation
            '/404.html',         # Error pages
            '/403.html'          # Error pages
        ]

        # If deployment failed or not hash-based, invalidate all
        if detail.get('state') == 'FAILED' or not artifact:
            paths_to_invalidate = ['/*']

        invalidation = client.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': len(paths_to_invalidate),
                    'Items': paths_to_invalidate
                },
                'CallerReference': f'deployment-{event["time"]}'
            }
        )

        print(f"Invalidation created: {invalidation['Invalidation']['Id']}")
        print(f"Invalidated paths: {paths_to_invalidate}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Invalidation created successfully',
                'invalidation_id': invalidation['Invalidation']['Id'],
                'paths_invalidated': paths_to_invalidate,
                'invalidation_type': 'selective' if len(paths_to_invalidate) < 5 else 'full'
            })
        }

    except Exception as e:
        print(f"Error creating invalidation: {str(e)}")
        # Fallback to full invalidation
        try:
            invalidation = client.create_invalidation(
                DistributionId=distribution_id,
                InvalidationBatch={
                    'Paths': {
                        'Quantity': 1,
                        'Items': ['/*']
                    },
                    'CallerReference': f'deployment-fallback-{event["time"]}'
                }
            )
            print(f"Fallback invalidation created: {invalidation['Invalidation']['Id']}")
        except Exception as fallback_error:
            print(f"Fallback invalidation failed: {str(fallback_error)}")
            raise e