# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
A module with errors raised by validator functions.
"""


class ValidationError(ValueError):
    """
    General Validation error raised by validators functions.
    error_messages attribute is used for storing aggregated error messages from multiple
    failed validations.
    If error_messages is not set explicitly, it would be created as list with message attribute as only item.
    """

    def __init__(self, message: str = "", error_messages: list[str] | None = None):
        if error_messages is None:
            error_messages = [message]
        self.error_messages = error_messages
        self.message = message
        super().__init__(self.message)
