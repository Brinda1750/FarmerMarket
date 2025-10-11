import boto3
import json
import os
import secrets
import string
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def generate_password(length=32):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+-="
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def handler(event, context):
    """Lambda handler for secret rotation"""

    client = boto3.client('secretsmanager')
    secret_prefix = os.environ['SECRET_PREFIX']

    try:
        # List all secrets with the project prefix
        secrets_list = client.list_secrets(
            Filters=[
                {
                    'Key': 'name',
                    'Values': [f'{secret_prefix}/']
                }
            ]
        )

        for secret in secrets_list['SecretList']:
            secret_name = secret['Name']

            # Skip if it's not a password we should rotate
            if not secret_name.endswith('/db_password'):
                continue

            logger.info(f"Rotating secret: {secret_name}")

            # Generate new password
            new_password = generate_password()

            # Update secret value
            client.put_secret_value(
                SecretId=secret_name,
                SecretString=new_password
            )

            logger.info(f"Successfully rotated secret: {secret_name}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Secret rotation completed successfully'
            })
        }

    except Exception as e:
        logger.error(f"Error rotating secrets: {str(e)}")
        raise e