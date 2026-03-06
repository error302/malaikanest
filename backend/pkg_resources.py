"""Compatibility shim for environments where setuptools no longer ships pkg_resources."""

from importlib.metadata import PackageNotFoundError, version


class DistributionNotFound(Exception):
    pass


class _Distribution:
    def __init__(self, pkg_name):
        self.version = version(pkg_name)


def get_distribution(package_name):
    try:
        return _Distribution(package_name)
    except PackageNotFoundError as exc:
        raise DistributionNotFound(str(exc))
