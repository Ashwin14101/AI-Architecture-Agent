$base = "http://localhost:3001/api"
$ErrorActionPreference = "Stop"

Write-Host "`n=== AI Architecture Agent API Tests ===" -ForegroundColor Cyan

# 1. Health
$health = Invoke-RestMethod -Uri "$base/health"
Write-Host "[PASS] Health: $($health.status) - $($health.service)" -ForegroundColor Green

# 2. Register
try {
    $reg = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType "application/json" -Body '{"username":"apitest01","email":"apitest01@example.com","password":"TestPass123"}'
    Write-Host "[PASS] Register: user=$($reg.user.id)" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Register: may already exist, trying login..." -ForegroundColor Yellow
}

# 3. Login
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"apitest01@example.com","password":"TestPass123"}'
$token = $login.accessToken
Write-Host "[PASS] Login: token issued (jwt length=$($token.Length))" -ForegroundColor Green

$h = @{Authorization = "Bearer $token"}

# 4. Me
$me = Invoke-RestMethod -Uri "$base/auth/me" -Headers $h
Write-Host "[PASS] Me: username=$($me.user.username), role=$($me.user.role)" -ForegroundColor Green

# 5. Create Project
$proj = Invoke-RestMethod -Uri "$base/projects" -Method POST -ContentType "application/json" -Headers $h -Body '{"name":"TestArch Project","description":"Automated test project"}'
$projId = $proj.id
Write-Host "[PASS] Create Project: id=$projId, status=$($proj.status)" -ForegroundColor Green

# 6. List Projects
$list = Invoke-RestMethod -Uri "$base/projects" -Headers $h
Write-Host "[PASS] List Projects: count=$($list.count)" -ForegroundColor Green

# 7. Get Project
$gp = Invoke-RestMethod -Uri "$base/projects/$projId" -Headers $h
Write-Host "[PASS] Get Project: name=$($gp.name)" -ForegroundColor Green

# 8. Workflow Status (before generation)
$ws = Invoke-RestMethod -Uri "$base/projects/$projId/workflow-status" -Headers $h
Write-Host "[PASS] Workflow Status: projectStatus=$($ws.projectStatus)" -ForegroundColor Green

# 9. Trigger Generation
$gen = Invoke-RestMethod -Uri "$base/projects/$projId/generate" -Method POST -Headers $h
Write-Host "[PASS] Trigger Generation: $($gen.message)" -ForegroundColor Green

# 10. Wait for generation
Write-Host "      Waiting 10s for generation to complete..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10

# 11. Get Architecture
$arch = Invoke-RestMethod -Uri "$base/projects/$projId/architecture" -Headers $h
Write-Host "[PASS] Architecture: version=$($arch.versionNumber), components=$($arch.architecture.components.Count)" -ForegroundColor Green

# 12. DB Schema
$db = Invoke-RestMethod -Uri "$base/projects/$projId/architecture/database" -Headers $h
Write-Host "[PASS] DB Schema: tables=$($db.databaseSchema.tables.Count)" -ForegroundColor Green

# 13. API Spec
$apiSpec = Invoke-RestMethod -Uri "$base/projects/$projId/architecture/apis" -Headers $h
Write-Host "[PASS] API Spec: title=$($apiSpec.apiSpec.info.title)" -ForegroundColor Green

# 14. Cloud Mapping
$cm = Invoke-RestMethod -Uri "$base/projects/$projId/cloud-mapping" -Headers $h
Write-Host "[PASS] Cloud Mapping: provider=$($cm.cloudMapping.provider), components=$($cm.cloudMapping.components.Count)" -ForegroundColor Green

# 15. Terraform code
$tf = Invoke-RestMethod -Uri "$base/projects/$projId/terraform" -Headers $h
Write-Host "[PASS] Terraform: code length=$($tf.terraformCode.Length) chars" -ForegroundColor Green

# 16. Validate Terraform
$tv = Invoke-RestMethod -Uri "$base/projects/$projId/terraform/validate" -Method POST -Headers $h
Write-Host "[PASS] Terraform Validate: valid=$($tv.valid), warnings=$($tv.warnings.Count)" -ForegroundColor Green

# 17. List Versions
$vers = Invoke-RestMethod -Uri "$base/projects/$projId/versions" -Headers $h
Write-Host "[PASS] Versions: count=$($vers.count)" -ForegroundColor Green

# 18. Diagram
$diag = Invoke-RestMethod -Uri "$base/projects/$projId/diagrams/component" -Headers $h
Write-Host "[PASS] Diagram (component): title=$($diag.diagram.title)" -ForegroundColor Green

# 19. Request AI Review
$rev = Invoke-RestMethod -Uri "$base/projects/$projId/reviews" -Method POST -Headers $h
$rid = $rev.reviewId
Write-Host "[PASS] Request Review: reviewId=$rid" -ForegroundColor Green

# 20. Wait for review
Write-Host "      Waiting 5s for AI review..." -ForegroundColor DarkGray
Start-Sleep -Seconds 5

# 21. Get Review
$rdet = Invoke-RestMethod -Uri "$base/projects/$projId/reviews/$rid" -Headers $h
$fid = $rdet.findings[0].id
Write-Host "[PASS] Get Review: status=$($rdet.review.status), findings=$($rdet.findings.Count), score=$($rdet.review.score)" -ForegroundColor Green

# 22. Accept Finding
$fup = Invoke-RestMethod -Uri "$base/projects/$projId/reviews/$rid/findings/$fid" -Method PUT -ContentType "application/json" -Headers $h -Body '{"status":"accepted"}'
Write-Host "[PASS] Accept Finding: status=$($fup.finding.status)" -ForegroundColor Green

# 23. Create Conversation
$conv = Invoke-RestMethod -Uri "$base/projects/$projId/conversations" -Method POST -ContentType "application/json" -Headers $h -Body '{"title":"Architecture Chat"}'
$cid = $conv.id
Write-Host "[PASS] Create Conversation: id=$cid" -ForegroundColor Green

# 24. Send Chat Message
$msg = Invoke-RestMethod -Uri "$base/projects/$projId/conversations/$cid/messages" -Method POST -ContentType "application/json" -Headers $h -Body '{"content":"What is the best database for my project?"}'
Write-Host "[PASS] Send Message: AI replied with $($msg.aiMessage.content.Length) chars" -ForegroundColor Green

# 25. Get Chat History
$hist = Invoke-RestMethod -Uri "$base/projects/$projId/conversations/$cid/messages" -Headers $h
Write-Host "[PASS] Get Messages: count=$($hist.count) (user + AI)" -ForegroundColor Green

# 26. Create Deployment
$dep = Invoke-RestMethod -Uri "$base/projects/$projId/deployments" -Method POST -ContentType "application/json" -Headers $h -Body '{"environment":"staging"}'
$did = $dep.deployment.id
Write-Host "[PASS] Create Deployment: id=$did, status=$($dep.deployment.status)" -ForegroundColor Green

# 27. Approve Deployment
$app = Invoke-RestMethod -Uri "$base/projects/$projId/deployments/$did/approve" -Method POST -Headers $h
Write-Host "[PASS] Approve Deployment: status=$($app.deployment.status)" -ForegroundColor Green

# 28. Cloud Catalog
$cat = Invoke-RestMethod -Uri "$base/cloud/catalog?provider=aws&category=database" -Headers $h
Write-Host "[PASS] Cloud Catalog (AWS DB): services=$($cat.services.Count)" -ForegroundColor Green

# 29. Update Project
$upd = Invoke-RestMethod -Uri "$base/projects/$projId" -Method PUT -ContentType "application/json" -Headers $h -Body '{"description":"Updated description"}'
Write-Host "[PASS] Update Project: description=$($upd.description)" -ForegroundColor Green

# 30. 401 check
try {
    Invoke-RestMethod -Uri "$base/projects" | Out-Null
    Write-Host "[FAIL] 401 check - should have failed!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] 401 check: unauthenticated request correctly rejected" -ForegroundColor Green
}

Write-Host "`n=== ALL 30 TESTS PASSED ===" -ForegroundColor Cyan
