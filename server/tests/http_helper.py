"""HTTP client for local test servers, independent of system proxy settings."""
from urllib.request import ProxyHandler, build_opener


_opener = build_opener(ProxyHandler({}))


def urlopen(url, data=None, timeout=None):
    """Open a local test URL without consulting system or environment proxies."""
    return _opener.open(url, data=data, timeout=timeout)
