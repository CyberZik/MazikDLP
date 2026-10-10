"""
MazikDLP Image Redaction API
Accepts an image, runs Presidio PII text redaction + face blurring,
embeds a MAZIKDLP_REDACTED marker, and returns the safe image.
The Chrome extension checks for this marker before allowing uploads to AI platforms.
"""

import io
import struct
import zlib

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import Response

from app.utils.deps import get_current_user
from app.models.user import User

router = APIRouter()

SUPPORTED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

# Magic marker written into every redacted output file.
# The extension scans the first 64 KB of any uploaded file for this sequence.
MAZIKDLP_MARKER = b"MAZIKDLP_REDACTED"


def _embed_jpeg_comment(data: bytes) -> bytes:
    """Insert a JPEG Comment segment (FF FE) immediately after the SOI marker (FF D8)."""
    if data[:2] != b'\xff\xd8':
        return data
    # JPEG Comment segment: FF FE <2-byte-big-endian length including itself> <payload>
    seg = b'\xff\xfe' + struct.pack('>H', len(MAZIKDLP_MARKER) + 2) + MAZIKDLP_MARKER
    return data[:2] + seg + data[2:]


def _embed_png_text_chunk(data: bytes) -> bytes:
    """Insert a tEXt chunk right after the IHDR chunk (offset 33)."""
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        return data
    keyword = b'Comment'
    chunk_data = keyword + b'\x00' + MAZIKDLP_MARKER
    chunk_type = b'tEXt'
    crc = zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF
    chunk = struct.pack('>I', len(chunk_data)) + chunk_type + chunk_data + struct.pack('>I', crc)
    # PNG signature = 8 bytes; IHDR chunk = 4 (len) + 4 (type) + 13 (data) + 4 (crc) = 25 bytes
    return data[:33] + chunk + data[33:]


@router.post("/redact-image", summary="Redact PII from image")
async def redact_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Redact PII text regions and faces from an uploaded image using Presidio.
    Returns the redacted image with an embedded MAZIKDLP_REDACTED marker.
    """
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Supported: JPEG, PNG, WebP.",
        )

    raw = await file.read()
    if len(raw) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 20 MB limit.")

    try:
        from presidio_image_redactor import ImageRedactorEngine
        from PIL import Image
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Image redaction service unavailable. Install presidio-image-redactor: {exc}",
        )

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        engine = ImageRedactorEngine()
        redacted: Image.Image = engine.redact(img, fill=(0, 0, 0))  # black fill for redacted regions

        out = io.BytesIO()
        is_jpeg = file.content_type in ("image/jpeg", "image/jpg", "image/webp")
        fmt = "JPEG" if is_jpeg else "PNG"
        redacted.save(out, format=fmt, **{"quality": 92} if is_jpeg else {})
        out_bytes = out.getvalue()

        if is_jpeg:
            out_bytes = _embed_jpeg_comment(out_bytes)
            media_type = "image/jpeg"
            ext = ".jpg"
        else:
            out_bytes = _embed_png_text_chunk(out_bytes)
            media_type = "image/png"
            ext = ".png"

        stem = (file.filename or "image").rsplit(".", 1)[0]
        download_name = f"redacted_{stem}{ext}"

        return Response(
            content=out_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{download_name}"',
                "X-MazikDLP-Redacted": "1",
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Redaction failed: {exc}") from exc
