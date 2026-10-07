import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import UploadFile, HTTPException
import uuid
import os
from app.core.config import settings

# Initialize S3 client using credentials from settings
def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )

async def upload_to_s3(file: UploadFile, folder: str = "documents") -> str:
    """
    Uploads a FastAPI UploadFile to AWS S3 and returns the public URL.
    """
    if not settings.AWS_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 Bucket name is not configured")

    s3_client = get_s3_client()
    
    # Generate a unique filename to avoid overwrites
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    s3_key = f"EOR/{folder}/{unique_filename}"
    
    try:
        # Read the file content
        file_content = await file.read()
        
        # Upload the file to S3
        s3_client.put_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type
            # ACL removed as the bucket is private and Bucket Owner Enforced
        )
        
        # Reset file pointer if it needs to be read again
        await file.seek(0)
        
        # Construct and return the static S3 URL (kept for DB compatibility, but will be converted to presigned URL later)
        region = settings.AWS_REGION
        bucket = settings.AWS_BUCKET_NAME
        s3_url = f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"
        return s3_url

    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not available")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during upload: {str(e)}")

def generate_presigned_url(s3_url_or_key: str, expires_in: int = 7200) -> str:
    """
    Generates a pre-signed URL for an S3 object.
    Accepts either a full S3 URL or just the S3 key.
    """
    if not s3_url_or_key:
        return ""
        
    s3_client = get_s3_client()
    bucket = settings.AWS_BUCKET_NAME
    region = settings.AWS_REGION
    
    # Extract the key if a full URL was provided
    s3_prefix = f"https://{bucket}.s3.{region}.amazonaws.com/"
    if s3_url_or_key.startswith(s3_prefix):
        s3_key = s3_url_or_key.replace(s3_prefix, "")
    else:
        s3_key = s3_url_or_key
        
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': s3_key},
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        # Fallback to the original URL if generation fails
        return s3_url_or_key
