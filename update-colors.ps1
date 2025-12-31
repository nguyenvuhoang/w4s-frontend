# Script to update all color codes to Vietnix color palette
# Compatible with PowerShell 5.1+
# Run this script from the project root directory

Write-Host "Starting color update to Vietnix palette..." -ForegroundColor Cyan

# Define color mappings
$colorMappings = @{
    '#0C9150' = '#225087'  # Primary green -> Primary blue
    '#0C9251' = '#225087'  # Primary green variant -> Primary blue
    '#119455' = '#225087'  # Green accent -> Primary blue
    '#087545' = '#1780AC'  # Dark green -> Dark blue (hover)
    '#0a7a42' = '#1780AC'  # Dark green variant -> Dark blue (hover)
    '#0FAD5E' = '#6EC2F7'  # Light green -> Light blue
}

# Get all TypeScript and TSX files in src directory
$files = Get-ChildItem -Path ".\src" -Recurse -Include "*.tsx","*.ts" | Where-Object { 
    $_.FullName -notmatch "node_modules" 
}

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    # PowerShell 5.1 compatible: read as array then join
    $contentArray = Get-Content $file.FullName -Encoding UTF8
    $content = $contentArray -join "`n"
    $originalContent = $content
    $fileChanged = $false
    
    foreach ($oldColor in $colorMappings.Keys) {
        $newColor = $colorMappings[$oldColor]
        
        # Case-insensitive replacement
        if ($content -match [regex]::Escape($oldColor)) {
            $count = ([regex]::Matches($content, [regex]::Escape($oldColor), [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
            $content = $content -replace [regex]::Escape($oldColor), $newColor
            $totalReplacements += $count
            $fileChanged = $true
            Write-Host "  Replaced $count occurrence(s) of $oldColor -> $newColor" -ForegroundColor Yellow
        }
    }
    
    # Save file if changed
    if ($fileChanged) {
        $content | Set-Content -Path $file.FullName -Encoding UTF8
        $totalFiles++
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nColor update completed!" -ForegroundColor Cyan
Write-Host "Files updated: $totalFiles" -ForegroundColor Green
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Green
Write-Host "`nVIETNIX Color Palette Applied:" -ForegroundColor Cyan
Write-Host "  Primary: #225087 (Vietnix Blue)" -ForegroundColor Blue
Write-Host "  Dark:    #1780AC (Dark Blue)" -ForegroundColor DarkBlue
Write-Host "  Light:   #6EC2F7 (Light Blue)" -ForegroundColor Cyan
