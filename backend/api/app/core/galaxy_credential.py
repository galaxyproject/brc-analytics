"""The credential a Galaxy API call runs with.

A logged-in user's own Keycloak bearer token (the BFF token already carries
aud=galaxy-api and the https://galaxyproject.org/api:* scope as realm default
client scopes), or the shared service-account API key for anonymous traffic.
"""

from dataclasses import dataclass, field
from typing import Literal, Optional


@dataclass(frozen=True)
class GalaxyCredential:
    kind: Literal["service", "user"]
    secret: str = field(repr=False)
    preferred_username: Optional[str] = None
    user_sub: Optional[str] = None
