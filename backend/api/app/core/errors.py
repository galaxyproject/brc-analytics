class CallerInputError(ValueError):
    """The request named something that doesn't exist or can't be served as
    asked. It's a normal answer for the caller, not a server fault, so Sentry
    drops it (see app.core.sentry). Subclasses ValueError so existing handlers
    keep catching it."""
