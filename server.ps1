# Lightweight web server in PowerShell: phục vụ website + API báo thanh toán
$path = $PSScriptRoot
if (-not $path) { $path = (Get-Location).Path }

# --- Mở cổng. Ưu tiên cho cả mạng LAN (cần chạy bằng quyền Administrator),
#     nếu không được thì chỉ mở cho chính máy này. Cổng 8080, bận thì 8081. ---
$listener = $null
$port = 0
$lanMode = $false
foreach ($tryPort in 8080, 8081) {
    foreach ($tryHost in '+', 'localhost') {
        try {
            $l = New-Object System.Net.HttpListener
            $l.Prefixes.Add("http://${tryHost}:${tryPort}/")
            $l.Start()
            $listener = $l
            $port = $tryPort
            $lanMode = ($tryHost -eq '+')
            break
        } catch { }
    }
    if ($listener) { break }
}
if (-not $listener) {
    Write-Host "Không mở được cổng 8080/8081 (có thể đang bị chương trình khác dùng)." -ForegroundColor Red
    exit 1
}
$prefix = "http://localhost:${port}/"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TRANANH SKIN - SERVER DƯỢC MỸ PHẨM ĐANG CHẠY" -ForegroundColor Green
Write-Host "  URL: $prefix" -ForegroundColor Yellow
if ($lanMode) {
    try {
        $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
            Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
            Select-Object -ExpandProperty IPAddress
        foreach ($ip in $ips) {
            Write-Host "  Máy khác cùng mạng: http://${ip}:${port}/" -ForegroundColor Yellow
        }
    } catch { }
} else {
    Write-Host "  Chỉ truy cập được từ máy này. Muốn điện thoại/máy khác vào được," -ForegroundColor Magenta
    Write-Host "  hãy chạy start-server.bat bằng quyền Administrator." -ForegroundColor Magenta
}
Write-Host "  Thư mục: $path" -ForegroundColor Gray
Write-Host "  Nhấn Ctrl+C để dừng server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Open default browser
Start-Process $prefix

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".webp"  = "image/webp"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".txt"   = "text/plain; charset=utf-8"
}

# ==========================================================
#  API báo thanh toán (lưu trong bộ nhớ, tắt server thì mất)
#    POST /api/payments                 đăng ký đơn đang chờ thanh toán
#    GET  /api/payments/<mã đơn>        trạng thái: pending | paid
#    POST /api/payments/<mã đơn>/claim  khách bấm "Tôi đã thanh toán"
#    POST /api/payments/<mã đơn>/paid   admin xác nhận đã nhận tiền
#    GET  /api/claims                   các đơn khách đã báo (24 giờ gần nhất, chưa xác nhận)
# ==========================================================
$payments = @{}

function Add-ApiHeaders($response) {
    $response.Headers.Add("Cache-Control", "no-store")
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
}

function Send-Json($response, $obj, [int]$status = 200) {
    $json = ConvertTo-Json -InputObject $obj -Depth 5 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.StatusCode = $status
    $response.ContentType = "application/json; charset=utf-8"
    Add-ApiHeaders $response
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Read-JsonBody($request) {
    try {
        if ($request.ContentLength64 -gt 20000) { return $null }
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $text = $reader.ReadToEnd()
        $reader.Close()
        if ($text) { return ($text | ConvertFrom-Json) }
    } catch { }
    return $null
}

function Get-Payment([string]$id) {
    if (-not $payments.ContainsKey($id)) {
        $payments[$id] = @{ orderId = $id; amount = 0; customerName = ''; status = 'pending'; claimedAt = $null }
    }
    return $payments[$id]
}

function Handle-Api($request, $response) {
    $method = $request.HttpMethod
    $p = $request.Url.AbsolutePath.Substring(5).Trim('/')   # bỏ "/api/"

    if ($method -eq 'OPTIONS') {
        $response.StatusCode = 204
        Add-ApiHeaders $response
        return
    }

    if ($method -eq 'POST' -and $p -eq 'payments') {
        $d = Read-JsonBody $request
        if ($d -and $d.orderId) {
            $pay = Get-Payment ([string]$d.orderId)
            if ($d.amount) { $pay.amount = [double]$d.amount }
        }
        Send-Json $response @{ ok = $true }
        return
    }

    if ($method -eq 'GET' -and $p -match '^payments/([^/]+)$') {
        $id = [uri]::UnescapeDataString($Matches[1])
        $st = 'pending'
        if ($payments.ContainsKey($id)) { $st = $payments[$id].status }
        Send-Json $response @{ orderId = $id; status = $st }
        return
    }

    if ($method -eq 'POST' -and $p -match '^payments/([^/]+)/(claim|paid)$') {
        $id = [uri]::UnescapeDataString($Matches[1])
        $action = $Matches[2]
        $d = Read-JsonBody $request
        $pay = Get-Payment $id
        if ($action -eq 'claim') {
            if (-not $pay.claimedAt) { $pay.claimedAt = (Get-Date).ToUniversalTime() }
            if ($d) {
                if ($d.amount) { $pay.amount = [double]$d.amount }
                if ($d.customerName) {
                    $n = [string]$d.customerName
                    if ($n.Length -gt 100) { $n = $n.Substring(0, 100) }
                    $pay.customerName = $n
                }
            }
        } else {
            $pay.status = 'paid'
        }
        Send-Json $response @{ ok = $true }
        return
    }

    if ($method -eq 'GET' -and $p -eq 'claims') {
        $since = (Get-Date).ToUniversalTime().AddHours(-24)
        $items = @()
        foreach ($pay in $payments.Values) {
            if ($pay.claimedAt -and $pay.status -ne 'paid' -and $pay.claimedAt -ge $since) {
                $items += [pscustomobject]@{
                    orderId      = $pay.orderId
                    amount       = $pay.amount
                    customerName = $pay.customerName
                    at           = $pay.claimedAt.ToString('o')
                }
            }
        }
        Send-Json $response @{ claims = @($items) }
        return
    }

    Send-Json $response @{ error = 'not found' } 404
}

$rootFull = [System.IO.Path]::GetFullPath($path).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
        if ($request.Url.AbsolutePath -like '/api/*') {
            Handle-Api $request $response
        } else {
            $urlPath = $request.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrEmpty($urlPath) -or $urlPath -eq "/") {
                $urlPath = "index.html"
            }

            $filePath = [System.IO.Path]::Combine($path, $urlPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
            $fullPath = [System.IO.Path]::GetFullPath($filePath)
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()

            # Chỉ phục vụ file nằm trong thư mục web, không phục vụ file script của server
            $allowed = $fullPath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase) -and
                       ($ext -ne '.ps1') -and ($ext -ne '.bat')

            if ($allowed -and [System.IO.File]::Exists($fullPath)) {
                $contentType = $mimeTypes[$ext]
                if (-not $contentType) { $contentType = "application/octet-stream" }
                $response.ContentType = $contentType

                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
            }
        }
    } catch {
        try { $response.StatusCode = 500 } catch { }
    } finally {
        try { $response.Close() } catch { }
    }
}