"""
REST API endpoints for user management.
"""

from flask import Flask, request, jsonify
from typing import Dict, Optional

app = Flask(__name__)

# In-memory user storage (for demo purposes)
users_db: Dict[str, Dict] = {}


@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users from the database."""
    return jsonify({"users": list(users_db.values())})


@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id: str):
    """Get a specific user by ID."""
    user = users_db.get(user_id)
    if user:
        return jsonify(user)
    return jsonify({"error": "User not found"}), 404


@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user."""
    data = request.get_json()
    user_id = data.get('id')
    
    if user_id in users_db:
        return jsonify({"error": "User already exists"}), 400
    
    users_db[user_id] = data
    return jsonify({"message": "User created", "user": data}), 201


@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id: str):
    """Update an existing user."""
    if user_id not in users_db:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    users_db[user_id].update(data)
    return jsonify({"message": "User updated", "user": users_db[user_id]})


@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id: str):
    """Delete a user by ID."""
    if user_id not in users_db:
        return jsonify({"error": "User not found"}), 404
    
    del users_db[user_id]
    return jsonify({"message": "User deleted"}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)

