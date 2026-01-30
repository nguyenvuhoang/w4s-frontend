$baseUrl = "http://localhost:3000/api/api-manager/spec"
$pdfPath = "c:\Project\w4s-frontend\public\test-upload.pdf"

# 1. Upload
Write-Host "1. Uploading PDF..."
$fileBytes = [System.IO.File]::ReadAllBytes($pdfPath)
$fileContent = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)
$boundary = "----WebKitFormBoundary$( [Guid]::NewGuid().ToString())"
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test-upload.pdf`"",
    "Content-Type: application/pdf",
    "",
    $fileContent,
    "--$boundary--"
) -join $LF

$upload = Invoke-WebRequest -Uri "$baseUrl/upload" -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
$draft = $upload.Content | ConvertFrom-Json
$draftId = $draft.id
Write-Host "Draft ID: $draftId"

# 2. Extract
Write-Host "2. Triggering Extraction..."
$extract = Invoke-WebRequest -Uri "$baseUrl/drafts/$draftId/extract" -Method Post
$extractJson = $extract.Content | ConvertFrom-Json
Write-Host "Status: $($extractJson.status)"
Write-Host "Title: $($extractJson.title)"

# 3. Generate OpenAPI
Write-Host "3. Generating OpenAPI..."
$gen = Invoke-WebRequest -Uri "$baseUrl/drafts/$draftId/generate-openapi" -Method Post
$genJson = $gen.Content | ConvertFrom-Json
Write-Host "OpenAPI Generated (Size: $($genJson.openApiSpec.Length) chars)"

# 4. Create API
Write-Host "4. Creating API..."
$body = @{
    name = "Test Banking API"
    version = "1.0.0"
    context = "/test-banking"
} | ConvertTo-Json
$create = Invoke-WebRequest -Uri "$baseUrl/drafts/$draftId/create-api" -Method Post -Body $body -ContentType "application/json"
$api = $create.Content | ConvertFrom-Json
Write-Host "API Created ID: $($api.id)"
Write-Host "API Status: $($api.status)"
