# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import unittest

from geti_logger_tools.logger_config import initialize_logger


class TestSanitizeLogFilter(unittest.TestCase):
    def test_sanitize_log_filter(self):
        test_logger = initialize_logger(__name__, use_async=False)
        with self.assertLogs(level="INFO", logger=test_logger) as log:
            test_logger.info("This is a test message\nwith a newline\rand a carriage return")
        self.assertIn("This is a test message with a newline and a carriage return", log.output[0])
