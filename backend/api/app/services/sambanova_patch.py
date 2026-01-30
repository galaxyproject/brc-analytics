"""
Monkey patch for SambaNova's non-standard API responses.
SambaNova returns float timestamps which breaks OpenAI client validation.
"""

import logging

from openai.types import chat

logger = logging.getLogger(__name__)


def patch_sambanova_compatibility():
    """
    Monkey-patch the OpenAI ChatCompletion validation to handle float timestamps.
    """
    original_validate = chat.ChatCompletion.model_validate

    def patched_validate(cls, obj, **kwargs):
        """Intercept and fix float timestamps before validation"""
        if isinstance(obj, dict) and "created" in obj:
            if isinstance(obj["created"], float):
                logger.debug(f"Converting float timestamp {obj['created']} to int")
                obj["created"] = int(obj["created"])
        return original_validate(obj, **kwargs)

    # Apply the monkey patch
    chat.ChatCompletion.model_validate = classmethod(patched_validate)
    logger.info("Applied SambaNova compatibility patch for float timestamps")
