"""
Scan request/response schemas.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to scan for sensitive data")
    user_id: Optional[str] = Field(None, description="User performing the scan")
    platform: Optional[str] = Field(None, description="AI platform (chatgpt, claude, gemini...)")
    model: Optional[str] = Field(None, description="AI model being used")
    session_id: Optional[str] = Field(None, description="Optional session ID for continuity")


class DetectedEntity(BaseModel):
    entity_type: str
    start: int
    end: int
    score: float
    text: str
    detector: str


class ScanResponse(BaseModel):
    action: str = Field(..., description="allow | alert | soft_block | hard_block | mask")
    message: Optional[str] = None
    masked_text: Optional[str] = None
    session_id: Optional[str] = None
    entities_detected: List[DetectedEntity] = Field(default_factory=list)
    policy_matched: Optional[str] = None


class RestoreRequest(BaseModel):
    masked_text: str = Field(..., description="Masked text to restore")
    session_id: str = Field(..., description="Session ID from the scan response")


class RestoreResponse(BaseModel):
    restored_text: str
    session_id: str


class DetectTestRequest(BaseModel):
    """Test detection without applying policies."""
    text: str = Field(..., min_length=1)


class DetectTestResponse(BaseModel):
    entities: List[DetectedEntity]
    count: int
    entity_types: List[str]
