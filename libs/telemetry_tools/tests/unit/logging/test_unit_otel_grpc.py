# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import logging
import unittest

from geti_logger_tools.logger_config import initialize_logger


class TestSanitizeLogFilter(unittest.TestCase):
    def test_sanitize_log_filter(self):
        # Create a mock log record
        log_record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname="test_path",
            lineno=10,
            msg="This is a test message\nwith a newline\rand a carriage return",
            args=None,
            exc_info=None,
        )

        # Initialize the logger to access the filter
        logger = initialize_logger("test_logger")
        sanitize_filter = logger.filters[0]  # Assuming the first filter is SanitizeLogFilter

        # Apply the filter
        result = sanitize_filter.filter(log_record)

        # Assert the filter was applied successfully
        self.assertTrue(result)
        self.assertEqual(
            log_record.msg,
            "This is a test message\\nwith a newline\\rand a carriage return",
        )
