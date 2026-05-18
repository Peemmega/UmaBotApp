param(
    [string]$CardsPath = (Join-Path $PSScriptRoot "..\public\tcg\cards"),
    [switch]$Apply
)

$resolvedCardsPath = Resolve-Path -LiteralPath $CardsPath -ErrorAction Stop
$files = Get-ChildItem -LiteralPath $resolvedCardsPath -Recurse -File |
    Where-Object { $_.Name -like "*_converted*" }

if (-not $files) {
    Write-Host "No files with '_converted' found under: $resolvedCardsPath"
    exit 0
}

$renames = foreach ($file in $files) {
    $newName = $file.Name -replace "_converted", ""
    $newPath = Join-Path $file.DirectoryName $newName

    [pscustomobject]@{
        OldPath = $file.FullName
        NewName = $newName
        NewPath = $newPath
    }
}

$conflicts = $renames | Where-Object { Test-Path -LiteralPath $_.NewPath }
if ($conflicts) {
    Write-Error "Rename stopped because target file(s) already exist:"
    $conflicts | ForEach-Object { Write-Error "  $($_.NewPath)" }
    exit 1
}

if (-not $Apply) {
    Write-Host "Dry run only. Add -Apply to rename files."
    $renames | ForEach-Object { Write-Host "$($_.OldPath) -> $($_.NewName)" }
    Write-Host "Total files: $($renames.Count)"
    exit 0
}

foreach ($rename in $renames) {
    Rename-Item -LiteralPath $rename.OldPath -NewName $rename.NewName
}

Write-Host "Renamed $($renames.Count) file(s)."
