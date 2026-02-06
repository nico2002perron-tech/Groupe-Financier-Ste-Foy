$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/Git-2.47.1-64-bit.exe"
$installerPath = "$PWD\git-installer.exe"

Write-Host "Downloading Git from $gitUrl..."
Invoke-WebRequest -Uri $gitUrl -OutFile $installerPath

if (Test-Path $installerPath) {
    Write-Host "Download complete. Installing Git..."
    # /VERYSILENT for no UI, /NORESTART to avoid restart, /NOCANCEL to prevent cancellation
    $process = Start-Process -FilePath $installerPath -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-", "/CLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS" -PassThru -Wait
    
    if ($process.ExitCode -eq 0) {
        Write-Host "Git installed successfully."
    } else {
        Write-Host "Git installation failed with exit code $($process.ExitCode)."
    }
    
    # Clean up
    Remove-Item $installerPath
} else {
    Write-Host "Failed to download Git installer."
}
