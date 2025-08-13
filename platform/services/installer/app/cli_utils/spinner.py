# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

"""
spinner module is a wrapper around click_spinner library which fixes known bug
"""

import click_spinner


def init_spin(self):  # noqa: ANN001, ANN201
    """
    This method overwrite fixes https://github.com/click-contrib/click-spinner/pull/37
    """
    while not self.stop_running.is_set():
        self.stream.write(next(self.spinner_cycle, "\b"))
        self.stream.write("\b")
        self.stream.flush()
        self.stop_running.wait(0.25)
    self.stream.write(" ")
    self.stream.write("\b")
    self.stream.flush()


click_spinner.Spinner.init_spin = init_spin  # type: ignore
