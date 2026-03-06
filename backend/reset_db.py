import sqlite3
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

print("Deleting SQLite data...")
conn = sqlite3.connect("users.db")
c = conn.cursor()
c.execute("DELETE FROM ingestion_records WHERE repo_name != 'sample'")
conn.commit()
conn.close()
print("SQLite cleared.")

print("Connecting to Qdrant...")
client = QdrantClient(path="./qdrant_db")

print("Fetching all points...")
res = client.scroll(collection_name="code_search", limit=10000, with_payload=True, with_vectors=False)
points = res[0]

ids_to_del = []
for p in points:
    r_name = p.payload.get("repo_name", "")
    if "sample" not in r_name.lower():
        ids_to_del.append(p.id)

print(f"Deleting {len(ids_to_del)} non-sample ghost points...")
if ids_to_del:
    client.delete(collection_name="code_search", points_selector=ids_to_del)
    print("Deleted successfully!")
else:
    print("No ghost points needed deleting.")

print("DONE.")
