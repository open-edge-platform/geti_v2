# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE
import logging

from geti_logger_tools.logger_config import initialize_logger


class TestLogging:
    def test_sanitize_log_filter_removes_newlines_and_carriage_returns(self, caplog):
        initialize_logger("init")
        # Create a logger and apply the SanitizeLogFilter
        logger = logging.getLogger("test_logger")

        # Log a message containing \n and \r
        test_message = "This is a test\nmessage with\rnewlines."
        logger.info(test_message)

        # Check the log output
        for record in caplog.records:
            assert "\\n" in record.msg
            assert "\\r" in record.msg
            assert "This is a test\\nmessage with\\rnewlines." in record.msg
