"""
Database connection and query utilities.
"""

import sqlite3
from contextlib import contextmanager
from typing import List, Dict, Optional, Any


class Database:
    """SQLite database wrapper."""
    
    def __init__(self, db_path: str = "app.db"):
        self.db_path = db_path
    
    @contextmanager
    def get_connection(self):
        """Get a database connection with automatic cleanup."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute a SELECT query and return results as list of dicts."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """Execute an INSERT/UPDATE/DELETE query and return affected rows."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount
    
    def create_table(self, table_name: str, schema: str):
        """Create a table with the given schema."""
        query = f"CREATE TABLE IF NOT EXISTS {table_name} ({schema})"
        self.execute_update(query)
    
    def insert_record(self, table_name: str, data: Dict[str, Any]) -> int:
        """Insert a record into a table."""
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        params = tuple(data.values())
        return self.execute_update(query, params)
    
    def find_by_id(self, table_name: str, record_id: Any) -> Optional[Dict[str, Any]]:
        """Find a record by ID."""
        query = f"SELECT * FROM {table_name} WHERE id = ?"
        results = self.execute_query(query, (record_id,))
        return results[0] if results else None

