# PowerShell script to extract text from the new docx file using wildcard matching
$matches = Get-ChildItem -Path "e:\tai_lieu_hoc\5\SWP391\fcms" -Filter "*task*.docx" | Where-Object { $_.Name -ne "SWP391_TaskBreakdown_Fixed.docx" }

if ($null -eq $matches -or $matches.Count -eq 0) {
    Write-Error "Could not find target docx file."
    exit
}

$docxPath = $matches[0].FullName
Write-Host "Found file: $docxPath"

$tempPath = "e:\tai_lieu_hoc\5\SWP391\fcms\scratch\temp_chot.docx"
$outputPath = "e:\tai_lieu_hoc\5\SWP391\fcms\scratch\phan_task_chot_extracted.txt"

try {
    # Open the file with FileShare.ReadWrite to bypass locked file issue
    $srcStream = New-Object System.IO.FileStream($docxPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    $destStream = New-Object System.IO.FileStream($tempPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
    $srcStream.CopyTo($destStream)
    $destStream.Close()
    $srcStream.Close()

    # Load the zip file using .NET ZipArchive
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    
    $zip = [System.IO.Compression.ZipFile]::OpenRead($tempPath)
    $entry = $zip.GetEntry("word/document.xml")
    
    if ($null -eq $entry) {
        Write-Error "word/document.xml not found in the docx file."
        $zip.Dispose()
        Remove-Item $tempPath
        exit
    }
    
    # Read the entry content
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xmlContent = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    $zip.Dispose()
    
    # Parse the XML content
    [xml]$xml = $xmlContent
    
    # Define namespace manager for w: prefix
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
    
    # Select all paragraph elements
    $paragraphs = $xml.SelectNodes("//w:p", $ns)
    
    $textLines = [System.Collections.Generic.List[string]]::new()
    foreach ($p in $paragraphs) {
        $texts = $p.SelectNodes(".//w:t", $ns)
        $pText = ""
        foreach ($t in $texts) {
            $pText += $t.InnerText
        }
        $textLines.Add($pText)
    }
    
    [System.IO.File]::WriteAllLines($outputPath, $textLines)
    Remove-Item $tempPath
    Write-Host "Successfully extracted text to $outputPath"
} catch {
    if (Test-Path $tempPath) { Remove-Item $tempPath }
    Write-Error "Error: $_"
}
