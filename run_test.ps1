param($testName, $outFile)
Set-Location "E:\AILOS_Project\ailos-server"
$result = & npx jest --no-coverage --forceExit -- $testName 2>&1
$result | Out-File -FilePath $outFile -Encoding UTF8
