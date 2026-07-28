import pytest

@pytest.mark.asyncio
async def test_project_lifecycle_and_rbac(client):
    # 1. Register a standard user
    reg = await client.post("/api/auth/register", json={
        "username": "architect1",
        "email": "arch1@example.com",
        "password": "Password123"
    })
    assert reg.status_code == 201
    
    login = await client.post("/api/auth/login", json={
        "email": "arch1@example.com",
        "password": "Password123"
    })
    token = login.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create project
    create_res = await client.post("/api/projects", json={
        "name": "E-Commerce System Design",
        "description": "High availability online store"
    }, headers=headers)
    assert create_res.status_code == 201
    proj_id = create_res.json()["id"]

    # 3. List projects
    list_res = await client.get("/api/projects", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["count"] == 1

    # 4. Get single project
    get_res = await client.get(f"/api/projects/{proj_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "E-Commerce System Design"

    # 5. Test RBAC: Non-admin trying to DELETE project -> expect 403 Forbidden
    del_res = await client.delete(f"/api/projects/{proj_id}", headers=headers)
    assert del_res.status_code == 403
