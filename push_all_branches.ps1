# Script to push all 3 branches to GitHub
Write-Host "Publishing AzureAce to GitHub..."
git push -u origin main
git push -u origin frontend
git push -u origin backend
Write-Host "All branches pushed successfully."
