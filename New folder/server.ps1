<#
.SYNOPSIS
    LearnMate AI - Windows Native Lightweight HTTP Server
.DESCRIPTION
    Runs natively in Windows PowerShell using System.Net.Sockets.TcpListener.
    Requires no Node.js, no administrator rights, and no external dependencies.
#>

param(
    [int]$Port = 3000
)

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)

try {
    $listener.Start()
    Write-Host "LearnMate AI Server listening on http://localhost:$Port/" -ForegroundColor Green

    $root = $PSScriptRoot

    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)

        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        while ($line = $reader.ReadLine()) {
            if ($line.Trim().Length -eq 0) { break }
        }

        $parts = $requestLine.Split(" ")
        $rawPath = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
        $path = $rawPath.Split("?")[0]

        if ($path -eq "/api/health") {
            $json = "{`"status`":`"ok`",`"hasApiKey`":false,`"provider`":`"demo_mode`"}"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $crlf = [char]13 + [char]10
            $headers = "HTTP/1.1 200 OK" + $crlf + "Content-Type: application/json; charset=utf-8" + $crlf + "Access-Control-Allow-Origin: *" + $crlf + "Content-Length: " + $bytes.Length + $crlf + "Connection: close" + $crlf + $crlf
            $hBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($hBytes, 0, $hBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
            $stream.Flush()
            $client.Close()
            continue
        }

        if ($path -eq "/" -or $path -eq "") {
            $path = "/index.html"
        }

        $cleanPath = $path.TrimStart("/").Replace("/", [string][System.IO.Path]::DirectorySeparatorChar)
        $localPath = Join-Path $root $cleanPath

        if (Test-Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = "text/plain; charset=utf-8"

            if ($ext -eq ".html") { $contentType = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
            elseif ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".json") { $contentType = "application/json; charset=utf-8" }
            elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            elseif ($ext -eq ".jpg") { $contentType = "image/jpeg" }

            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $crlf = [char]13 + [char]10
            $headers = "HTTP/1.1 200 OK" + $crlf + "Content-Type: " + $contentType + $crlf + "Access-Control-Allow-Origin: *" + $crlf + "Content-Length: " + $bytes.Length + $crlf + "Connection: close" + $crlf + $crlf
            $hBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($hBytes, 0, $hBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
            $stream.Flush()
        } else {
            $body = [System.Text.Encoding]::ASCII.GetBytes("404 Not Found")
            $crlf = [char]13 + [char]10
            $headers = "HTTP/1.1 404 Not Found" + $crlf + "Content-Type: text/plain" + $crlf + "Content-Length: " + $body.Length + $crlf + "Connection: close" + $crlf + $crlf
            $hBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($hBytes, 0, $hBytes.Length)
            $stream.Write($body, 0, $body.Length)
            $stream.Flush()
        }

        $client.Close()
    }
} catch {
    Write-Host "Server stopped: $_" -ForegroundColor Red
} finally {
    if ($listener) { $listener.Stop() }
}
