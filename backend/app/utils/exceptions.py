"""
MazikDLP Custom Exceptions
Structured exception hierarchy for the entire application.
"""


class MazikDLPException(Exception):
    """Base exception for all MazikDLP errors."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: dict = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(MazikDLPException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed", details: dict = None):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=401,
            details=details,
        )


class AuthorizationError(MazikDLPException):
    """Raised when user lacks required permissions."""

    def __init__(self, message: str = "Insufficient permissions", details: dict = None):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=403,
            details=details,
        )


class NotFoundError(MazikDLPException):
    """Raised when a resource is not found."""

    def __init__(self, resource: str = "Resource", resource_id: str = None, details: dict = None):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with ID '{resource_id}' not found"
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            details=details or {"resource": resource, "resource_id": resource_id},
        )


class ConflictError(MazikDLPException):
    """Raised when a resource already exists or conflicts."""

    def __init__(self, message: str = "Resource already exists", details: dict = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details=details,
        )


class ValidationError(MazikDLPException):
    """Raised when input validation fails."""

    def __init__(self, message: str = "Validation failed", details: dict = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class RateLimitError(MazikDLPException):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 60, details: dict = None):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details or {"retry_after_seconds": retry_after},
        )


class DetectionError(MazikDLPException):
    """Raised when the detection engine fails."""

    def __init__(self, message: str = "Detection engine error", details: dict = None):
        super().__init__(
            message=message,
            code="DETECTION_ERROR",
            status_code=500,
            details=details,
        )


class PolicyError(MazikDLPException):
    """Raised when policy evaluation fails."""

    def __init__(self, message: str = "Policy evaluation error", details: dict = None):
        super().__init__(
            message=message,
            code="POLICY_ERROR",
            status_code=500,
            details=details,
        )


class ExternalServiceError(MazikDLPException):
    """Raised when an external service call fails."""

    def __init__(self, service: str, message: str = "External service unavailable", details: dict = None):
        super().__init__(
            message=f"{service}: {message}",
            code="EXTERNAL_SERVICE_ERROR",
            status_code=503,
            details=details or {"service": service},
        )


class ConfigurationError(MazikDLPException):
    """Raised when there's a configuration issue."""

    def __init__(self, message: str = "Configuration error", details: dict = None):
        super().__init__(
            message=message,
            code="CONFIGURATION_ERROR",
            status_code=500,
            details=details,
        )
