"""
General utility functions.
"""

import hashlib
import re
from datetime import datetime
from typing import List, Dict, Any


def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def format_timestamp(timestamp: datetime) -> str:
    """Format datetime to ISO string."""
    return timestamp.isoformat()


def chunk_list(items: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split a list into chunks of specified size."""
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def flatten_dict(nested_dict: Dict, separator: str = '.') -> Dict:
    """Flatten a nested dictionary."""
    flattened = {}
    for key, value in nested_dict.items():
        if isinstance(value, dict):
            for sub_key, sub_value in flatten_dict(value, separator).items():
                flattened[f"{key}{separator}{sub_key}"] = sub_value
        else:
            flattened[key] = value
    return flattened


def merge_dicts(*dicts: Dict) -> Dict:
    """Merge multiple dictionaries."""
    result = {}
    for d in dicts:
        result.update(d)
    return result


def remove_duplicates(items: List[Any]) -> List[Any]:
    """Remove duplicates from a list while preserving order."""
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result

