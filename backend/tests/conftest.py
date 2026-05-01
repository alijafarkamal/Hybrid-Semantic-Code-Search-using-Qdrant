import pytest

import reasoning


@pytest.fixture(autouse=True)
def reset_httpx_singleton():
    reasoning._httpx_client = None
    yield
    reasoning._httpx_client = None
