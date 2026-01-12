# PowerShell Script: Refactor to Feature-First Architecture
# Run this script from the project root directory

Write-Host "Starting Feature-First Refactoring..." -ForegroundColor Green

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "src/features/business/pages"
New-Item -ItemType Directory -Force -Path "src/features/community/pages"
New-Item -ItemType Directory -Force -Path "src/features/ads/pages"
New-Item -ItemType Directory -Force -Path "src/components/ui"
New-Item -ItemType Directory -Force -Path "src/lib"

Write-Host "Moving Business feature files..." -ForegroundColor Yellow
# Business feature
Move-Item -Path "src/pages/BusinessXPage.js" -Destination "src/features/business/pages/" -Force
Move-Item -Path "src/pages/BusinessXPage.css" -Destination "src/features/business/pages/" -Force
Move-Item -Path "src/pages/RegisterBusinessPage.js" -Destination "src/features/business/pages/" -Force
Move-Item -Path "src/pages/RegisterBusinessPage.css" -Destination "src/features/business/pages/" -Force
Move-Item -Path "src/pages/BusinessDetailPage.js" -Destination "src/features/business/pages/" -Force
Move-Item -Path "src/pages/BusinessDetailPage.css" -Destination "src/features/business/pages/" -Force

Write-Host "Moving Community feature files..." -ForegroundColor Yellow
# Community feature
Move-Item -Path "src/pages/CommunityPage.js" -Destination "src/features/community/pages/" -Force
Move-Item -Path "src/pages/CommunityPage.css" -Destination "src/features/community/pages/" -Force
Move-Item -Path "src/pages/PostDetailPage.js" -Destination "src/features/community/pages/" -Force
Move-Item -Path "src/pages/PostDetailPage.css" -Destination "src/features/community/pages/" -Force
Move-Item -Path "src/pages/CreatePostPage.js" -Destination "src/features/community/pages/" -Force
Move-Item -Path "src/pages/CreatePostPage.css" -Destination "src/features/community/pages/" -Force

Write-Host "Moving Ads feature files..." -ForegroundColor Yellow
# Ads feature
Move-Item -Path "src/pages/AdsXPage.js" -Destination "src/features/ads/pages/" -Force
Move-Item -Path "src/pages/AdsXPage.css" -Destination "src/features/ads/pages/" -Force
Move-Item -Path "src/pages/SubmitRequestPage.js" -Destination "src/features/ads/pages/" -Force
Move-Item -Path "src/pages/SubmitRequestPage.css" -Destination "src/features/ads/pages/" -Force
Move-Item -Path "src/pages/RequestDetailPage.js" -Destination "src/features/ads/pages/" -Force
Move-Item -Path "src/pages/RequestDetailPage.css" -Destination "src/features/ads/pages/" -Force

Write-Host "Moving library files..." -ForegroundColor Yellow
# Move firebase.js to lib/
Move-Item -Path "src/firebase.js" -Destination "src/lib/" -Force

Write-Host "Refactoring complete! Now update imports in:" -ForegroundColor Green
Write-Host "  - All moved feature files" -ForegroundColor Cyan
Write-Host "  - App.js" -ForegroundColor Cyan
Write-Host "  - Any files importing firebase.js" -ForegroundColor Cyan

