"""
Configuration of base logger for the entire platform.
Logger parameters are stored in a config map and are available in every container having it mounted.
"""

import logging
import os

LOGGER_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
NON_CONFIGURABLE_LOGGERS = ["uvicorn.access", "werkzeug", "pika", "aiohttp.access", "geti_logger_tools.logger_config"]
# TODO: https://jira.devtools.intel.com/browse/ITEP-70813
LOG_LEVEL = getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO)


def get_logging_format(extra_headers: str = "") -> str:
    """
    Get the logging format as a string.

    :param extra_headers: Optional format string to embed additional headers before the message in the log records
    :returns: Logging format as string
    """
    extra_headers_str = f" {extra_headers}" if extra_headers else ""
    return f"%(asctime)s,%(msecs)03d [%(levelname)-8s] [%(name)s:%(lineno)d]{extra_headers_str}: %(message)s"


def initialize_logger(package_name: str, logging_format: str | None = None) -> logging.Logger:
    """
    Initialize logger with a filter to sanitize log messages to prevent log injection.

    :param package_name: given name of package for the logger
    :param logging_format: optional, logging format to use instead of the default one
    :return: initialized logger
    """
    if logging_format is None:
        logging_format = get_logging_format()
    logging.basicConfig(level=LOG_LEVEL, format=logging_format, datefmt=LOGGER_DATE_FORMAT, force=True)
    return logging.getLogger(package_name)
