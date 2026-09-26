import pytest

@pytest.mark.asyncio
async def test_document_upload_and_list(client):
    # 1. Setup user and project
    await client.post("/api/auth/register", json={
        "username": "docuser",
        "email": "doc@example.com",
        "password": "Password123"
    })
    login = await client.post("/api/auth/login", json={
        "email": "doc@example.com",
        "password": "Password123"
    })
    token = login.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await client.post("/api/projects", json={
        "name": "Doc Test Project",
        "description": "Testing document uploading"
    }, headers=headers)
    proj_id = create_res.json()["id"]

    # 2. Test document upload
    files = {"file": ("requirements.txt", b"System must support 1000 requests per second.", "text/plain")}
    upload_res = await client.post(f"/api/projects/{proj_id}/documents", files=files, headers=headers)
    assert upload_res.status_code == 201
    assert "Document uploaded" in upload_res.json()["message"]

    # 3. Test list documents
    list_res = await client.get(f"/api/projects/{proj_id}/documents", headers=headers)
    assert list_res.status_code == 200
    docs = list_res.json()
    assert len(docs) == 1
    assert docs[0]["name"] == "requirements.txt"
