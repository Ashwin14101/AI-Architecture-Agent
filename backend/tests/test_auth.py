import pytest

@pytest.mark.asyncio
async def test_register_and_login(client):
    # 1. Test registration
    reg_payload = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "SecretPassword123"
    }
    response = await client.post("/api/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "testuser@example.com"
    assert data["user"]["username"] == "testuser"

    # 2. Test duplicate registration failure
    dup_response = await client.post("/api/auth/register", json=reg_payload)
    assert dup_response.status_code == 400

    # 3. Test valid login
    login_payload = {
        "email": "testuser@example.com",
        "password": "SecretPassword123"
    }
    login_res = await client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "accessToken" in token_data
    token = token_data["accessToken"]

    # 4. Test invalid login
    bad_login_res = await client.post("/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "WrongPassword"
    })
    assert bad_login_res.status_code == 401

    # 5. Test authenticated /me endpoint
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == "testuser@example.com"

    # 6. Test invalid token on /me
    bad_me_res = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token_str"})
    assert bad_me_res.status_code == 401
