from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from app.utils.s3 import generate_presigned_url

router = APIRouter()

@router.get("/view")
async def view_media(key: str = Query(..., description="The S3 URL or key of the file to view")):
    """
    GET /api/media/view?key=...
    Generates a pre-signed URL and redirects the client to it.
    This allows using this endpoint directly in <img src="..."> or <a href="..."> tags.
    """
    try:
        if not key:
            raise HTTPException(status_code=400, detail="Key parameter is required")
            
        presigned_url = generate_presigned_url(key, expires_in=7200) # 2 hours validity
        
        if not presigned_url:
            raise HTTPException(status_code=500, detail="Failed to generate URL")
            
        return RedirectResponse(url=presigned_url, status_code=302)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
