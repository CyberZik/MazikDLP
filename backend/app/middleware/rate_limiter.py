"""
Redis-based sliding window rate limiter middleware.
Limits requests per IP address using Redis sorted sets.
"""
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("mazikdlp.rate_limiter")


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Rate limiter using Redis sliding window algorithm.
    Falls back to allowing requests if Redis is unavailable.
    """

    def __init__(self, app, redis_client=None, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.redis = redis_client
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/api/v1/health", "/api/v1/health/detailed", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # If no Redis, allow all requests
        if self.redis is None:
            return await call_next(request)

        try:
            is_allowed, remaining, reset_time = await self._check_rate_limit(client_ip)

            if not is_allowed:
                logger.warning(f"Rate limit exceeded | ip={client_ip}")
                return JSONResponse(
                    status_code=429,
                    content={
                        "status": "error",
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Too many requests. Limit: {self.max_requests} per {self.window_seconds}s",
                            "retry_after": reset_time,
                        }
                    },
                    headers={
                        "Retry-After": str(reset_time),
                        "X-RateLimit-Limit": str(self.max_requests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(time.time()) + reset_time),
                    }
                )

            response = await call_next(request)

            # Add rate limit headers to response
            response.headers["X-RateLimit-Limit"] = str(self.max_requests)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + self.window_seconds)

            return response

        except Exception as e:
            logger.error(f"Rate limiter error: {e}. Allowing request.")
            return await call_next(request)

    async def _check_rate_limit(self, client_ip: str):
        """
        Sliding window rate limit check using Redis sorted sets.
        Returns: (is_allowed, remaining_requests, reset_time_seconds)
        """
        key = f"mazikdlp:ratelimit:{client_ip}"
        now = time.time()
        window_start = now - self.window_seconds

        pipe = self.redis.pipeline()

        # Remove old entries outside the window
        pipe.zremrangebyscore(key, 0, window_start)

        # Count current entries in window
        pipe.zcard(key)

        # Add current request
        pipe.zadd(key, {str(now): now})

        # Set expiry on the key
        pipe.expire(key, self.window_seconds)

        results = await pipe.execute()
        request_count = results[1]

        if request_count >= self.max_requests:
            # Get the oldest entry to calculate reset time
            oldest = await self.redis.zrange(key, 0, 0, withscores=True)
            if oldest:
                reset_time = int(self.window_seconds - (now - oldest[0][1]))
                reset_time = max(reset_time, 1)
            else:
                reset_time = self.window_seconds
            return False, 0, reset_time

        remaining = self.max_requests - request_count - 1
        return True, remaining, self.window_seconds
