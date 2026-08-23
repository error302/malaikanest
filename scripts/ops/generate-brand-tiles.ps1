Add-Type -AssemblyName System.Drawing

$outRoot = "frontend\public\images"

function New-BrandTile {
    param(
        [string]$OutFile,
        [int]$Width = 800,
        [int]$Height = 1000,
        [string]$BigText,
        [string]$Caption,
        [switch]$MoonMotif
    )

    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Warm cream vertical gradient (brand-cream family)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $c1 = [System.Drawing.Color]::FromArgb(255, 251, 246, 239)
    $c2 = [System.Drawing.Color]::FromArgb(255, 240, 228, 211)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 90)
    $g.FillRectangle($brush, $rect)

    # Large soft gold arch (offset circle outline, top-right)
    $goldA = [System.Drawing.Color]::FromArgb(70, 201, 162, 39)
    $goldPen = New-Object System.Drawing.Pen($goldA, 10)
    $archR = [int]($Width * 0.55)
    $g.DrawEllipse($goldPen, $Width - $archR, -$archR, $archR * 2, $archR * 2)
    $goldPen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 201, 162, 39), 4)
    $g.DrawEllipse($goldPen2, $Width - $archR - 40, -$archR - 40, $archR * 2, $archR * 2)

    # Bottom-left soft terracotta circle
    $terra = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 176, 106, 74))
    $terraR = [int]($Width * 0.35)
    $g.FillEllipse($terra, -$terraR * 0.4, $Height - $terraR, $terraR, $terraR)

    if ($MoonMotif) {
        # Crescent moon + two stars, gold, centered upper third
        $cx = $Width * 0.5; $cy = $Height * 0.30; $r = [int]($Width * 0.13)
        $moonBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 176, 138, 62))
        $g.FillEllipse($moonBrush, $cx - $r, $cy - $r, $r * 2, $r * 2)
        $cutBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 241, 230))
        $g.FillEllipse($cutBrush, $cx - $r * 0.25 - $r * 0.55, $cy - $r - $r * 0.28, $r * 1.55, $r * 1.55)
        $starPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 176, 138, 62), 6)
        $starPen.StartCap = 'Round'; $starPen.EndCap = 'Round'
        foreach ($s in @(@{x=0.24;y=0.16;s=16}, @{x=0.74;y=0.22;s=12}, @{x=0.30;y=0.40;s=10})) {
            $sx = $Width * $s.x; $sy = $Height * $s.y; $ss = $s.s
            $g.DrawLine($starPen, $sx - $ss, $sy, $sx + $ss, $sy)
            $g.DrawLine($starPen, $sx, $sy - $ss, $sx, $sy + $ss)
        }
        $starPen.Dispose(); $moonBrush.Dispose(); $cutBrush.Dispose()
    }

    # Big serif text
    $brown = [System.Drawing.Color]::FromArgb(255, 107, 79, 58)
    $goldT = [System.Drawing.Color]::FromArgb(255, 166, 124, 46)
    $fontBig = New-Object System.Drawing.Font('Georgia', 150, [System.Drawing.FontStyle]::Regular)
    $fontCap = New-Object System.Drawing.Font('Georgia', 34, [System.Drawing.FontStyle]::Regular)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'

    $textBrush = New-Object System.Drawing.SolidBrush($brown)
    $capBrush = New-Object System.Drawing.SolidBrush($goldT)

    $bigY = if ($MoonMotif) { 0.58 } else { 0.46 }
    $capY = $bigY + 0.17
    $g.DrawString($BigText, $fontBig, $textBrush, ([float]($Width * 0.5)), ([float]($Height * $bigY)), $sf)
    if ($Caption) {
        $g.DrawString($Caption, $fontCap, $capBrush, ([float]($Width * 0.5)), ([float]($Height * $capY)), $sf)
    }

    $g.Dispose()
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 82L)
    $bmp.Save($OutFile, $codec, $ep)
    $bmp.Dispose()
    Write-Host "wrote $OutFile"
}

# Age tiles (portrait 4:5)
New-BrandTile -OutFile "$outRoot\ages\2-4y.jpg"   -BigText "2-4"   -Caption "Y E A R S"
New-BrandTile -OutFile "$outRoot\ages\4-6y.jpg"   -BigText "4-6"   -Caption "Y E A R S"
New-BrandTile -OutFile "$outRoot\ages\6-9y.jpg"   -BigText "6-9"   -Caption "Y E A R S"
New-BrandTile -OutFile "$outRoot\ages\9-12y.jpg"  -BigText "9-12"  -Caption "Y E A R S"

# Nursery category tiles (landscape 4:3) with moon motif
function New-BrandTileLandscape {
    param([string]$OutFile, [string]$BigText, [string]$Caption)
    New-BrandTile -OutFile $OutFile -Width 800 -Height 600 -BigText $BigText -Caption $Caption -MoonMotif
}
New-BrandTileLandscape -OutFile "$outRoot\categories\nursery.jpg"      -BigText "Nursery"      -Caption ""
New-BrandTileLandscape -OutFile "$outRoot\categories\nursery-gear.jpg" -BigText "Nursery Gear" -Caption ""

Write-Host "done"
