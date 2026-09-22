using namespace System.Drawing
using namespace System.Drawing.Drawing2D
using namespace System.Drawing.Imaging

param(
  [string] $PackageRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch] $ForceGenerated,
  [switch] $ForceTerrain
)

# Deterministic Phase 1 packer. Raw generated sheets live in the documented
# project-local source folder; runtime atlases live beside the package code.
# Each output is guarded independently so one missing file never causes another
# already-packed atlas to be sampled again.
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$assetRoot = Join-Path $PackageRoot "src/assets"
$applicationRoot = (Resolve-Path (Join-Path $PackageRoot "../..")).Path
$sourceRoot = Join-Path $applicationRoot "docs/concepts/vedas-great-escape/sources"
$pixelFormat = [PixelFormat]::Format32bppArgb
$cellSize = 192
$gutter = 17

function Test-AtlasDimensions([string] $path, [int] $width, [int] $height) {
  if (-not (Test-Path -LiteralPath $path)) { return $false }
  $bitmap = [Bitmap]::new($path)
  $matches = $bitmap.Width -eq $width -and $bitmap.Height -eq $height
  $bitmap.Dispose()
  return $matches
}

function Get-AlphaBounds([Bitmap] $bitmap, [int] $threshold = 32) {
  $minX = $bitmap.Width
  $minY = $bitmap.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      if ($bitmap.GetPixel($x, $y).A -ge $threshold) {
        $minX = [Math]::Min($minX, $x)
        $minY = [Math]::Min($minY, $y)
        $maxX = [Math]::Max($maxX, $x)
        $maxY = [Math]::Max($maxY, $y)
      }
    }
  }
  return @{ MinX = $minX; MinY = $minY; MaxX = $maxX; MaxY = $maxY }
}

function Clear-LowAlpha([Bitmap] $bitmap, [int] $threshold = 32) {
  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      $pixel = $bitmap.GetPixel($x, $y)
      if ($pixel.A -lt $threshold) {
        $bitmap.SetPixel($x, $y, [Color]::Transparent)
      }
    }
  }
}

function Remove-SmallAlphaComponents([Bitmap] $bitmap, [int] $minimumPixels = 48) {
  $visited = New-Object 'bool[,]' $bitmap.Width, $bitmap.Height
  $neighbors = @(-1, 0, 1)
  for ($startY = 0; $startY -lt $bitmap.Height; $startY++) {
    for ($startX = 0; $startX -lt $bitmap.Width; $startX++) {
      if ($visited[$startX, $startY]) { continue }
      $visited[$startX, $startY] = $true
      if ($bitmap.GetPixel($startX, $startY).A -lt 32) { continue }
      $queue = [System.Collections.Generic.Queue[Point]]::new()
      $component = [System.Collections.Generic.List[Point]]::new()
      $queue.Enqueue([Point]::new($startX, $startY))
      while ($queue.Count -gt 0) {
        $point = $queue.Dequeue()
        $component.Add($point)
        foreach ($offsetY in $neighbors) {
          foreach ($offsetX in $neighbors) {
            if ($offsetX -eq 0 -and $offsetY -eq 0) { continue }
            $x = $point.X + $offsetX
            $y = $point.Y + $offsetY
            if ($x -lt 0 -or $y -lt 0 -or $x -ge $bitmap.Width -or $y -ge $bitmap.Height) { continue }
            if ($visited[$x, $y]) { continue }
            $visited[$x, $y] = $true
            if ($bitmap.GetPixel($x, $y).A -ge 32) {
              $queue.Enqueue([Point]::new($x, $y))
            }
          }
        }
      }
      if ($component.Count -lt $minimumPixels) {
        foreach ($point in $component) {
          $bitmap.SetPixel($point.X, $point.Y, [Color]::Transparent)
        }
      }
    }
  }
}

function Get-SourceCell([Bitmap] $source, [int] $column, [int] $row, [int] $columns, [int] $rows) {
  $left = [Math]::Floor($column * $source.Width / $columns)
  $top = [Math]::Floor($row * $source.Height / $rows)
  $right = [Math]::Floor(($column + 1) * $source.Width / $columns)
  $bottom = [Math]::Floor(($row + 1) * $source.Height / $rows)
  $cell = $source.Clone(
    [Rectangle]::new($left, $top, $right - $left, $bottom - $top),
    $pixelFormat
  )
  Clear-LowAlpha $cell
  return $cell
}

function Get-ContactCenterX([Bitmap] $bitmap, $bounds) {
  $contactTop = [Math]::Max($bounds.MinY, $bounds.MaxY - 18)
  $minX = $bitmap.Width
  $maxX = -1
  for ($y = $contactTop; $y -le $bounds.MaxY; $y++) {
    for ($x = $bounds.MinX; $x -le $bounds.MaxX; $x++) {
      if ($bitmap.GetPixel($x, $y).A -ge 32) {
        $minX = [Math]::Min($minX, $x)
        $maxX = [Math]::Max($maxX, $x)
      }
    }
  }
  if ($maxX -lt 0) { return ($bounds.MinX + $bounds.MaxX) / 2 }
  return ($minX + $maxX) / 2
}

function Clear-CellGutter([Bitmap] $bitmap, [int] $left, [int] $top) {
  for ($y = 0; $y -lt $cellSize; $y++) {
    for ($x = 0; $x -lt $cellSize; $x++) {
      if ($x -lt $gutter -or $y -lt $gutter -or $x -ge $cellSize - $gutter -or $y -ge $cellSize - $gutter) {
        $bitmap.SetPixel($left + $x, $top + $y, [Color]::Transparent)
      }
    }
  }
}

function Align-CharacterAtlas([string] $path, [int] $columns, [int] $rows) {
  $source = [Bitmap]::new($path)
  $targetBottom = $cellSize - $gutter - 1
  $targetContactX = [Math]::Floor($cellSize / 2)
  $offsets = @()
  $alreadyAligned = $true

  for ($row = 0; $row -lt $rows; $row++) {
    for ($column = 0; $column -lt $columns; $column++) {
      $cell = $source.Clone(
        [Rectangle]::new($column * $cellSize, $row * $cellSize, $cellSize, $cellSize),
        $pixelFormat
      )
      $bounds = Get-AlphaBounds $cell
      # X is an optical silhouette anchor; Y is the ground/contact anchor.
      # A footprint-only X anchor would pull long pushing trunks into the crop.
      $opticalX = ($bounds.MinX + $bounds.MaxX) / 2
      $offsetX = [Math]::Round($targetContactX - $opticalX)
      $offsetX = [Math]::Max($gutter - $bounds.MinX, $offsetX)
      $offsetX = [Math]::Min(($cellSize - $gutter - 1) - $bounds.MaxX, $offsetX)
      $offsetY = $targetBottom - $bounds.MaxY
      if ($offsetX -ne 0 -or $offsetY -ne 0) { $alreadyAligned = $false }
      $offsets += ,@{ X = $offsetX; Y = $offsetY }
      $cell.Dispose()
    }
  }
  if ($alreadyAligned) {
    $source.Dispose()
    return
  }

  $output = [Bitmap]::new($source.Width, $source.Height, $pixelFormat)
  $canvas = [Graphics]::FromImage($output)
  $canvas.CompositingMode = [CompositingMode]::SourceCopy
  $canvas.Clear([Color]::Transparent)
  $canvas.CompositingMode = [CompositingMode]::SourceOver
  $index = 0
  for ($row = 0; $row -lt $rows; $row++) {
    for ($column = 0; $column -lt $columns; $column++) {
      $cell = $source.Clone(
        [Rectangle]::new($column * $cellSize, $row * $cellSize, $cellSize, $cellSize),
        $pixelFormat
      )
      $offset = $offsets[$index++]
      $canvas.DrawImageUnscaled(
        $cell,
        $column * $cellSize + $offset.X,
        $row * $cellSize + $offset.Y
      )
      $cell.Dispose()
    }
  }
  $canvas.Dispose()
  $source.Dispose()
  for ($row = 0; $row -lt $rows; $row++) {
    for ($column = 0; $column -lt $columns; $column++) {
      Clear-CellGutter $output ($column * $cellSize) ($row * $cellSize)
    }
  }
  Clear-LowAlpha $output
  $temporary = "$path.aligned.png"
  $output.Save($temporary, [ImageFormat]::Png)
  $output.Dispose()
  Move-Item -LiteralPath $temporary -Destination $path -Force
}

function Pack-CharacterAtlas(
  [string] $sourcePath,
  [string] $outputPath,
  [int] $sourceColumns,
  [int] $sourceRows,
  [int] $outputColumns,
  [int] $outputRows,
  [array] $mapping
) {
  $source = [Bitmap]::new($sourcePath)
  $cells = @()
  $maxWidth = 0
  $maxHeight = 0
  foreach ($entry in $mapping) {
    $cell = Get-SourceCell $source $entry.SourceColumn $entry.SourceRow $sourceColumns $sourceRows
    $bounds = Get-AlphaBounds $cell
    $maxWidth = [Math]::Max($maxWidth, $bounds.MaxX - $bounds.MinX + 1)
    $maxHeight = [Math]::Max($maxHeight, $bounds.MaxY - $bounds.MinY + 1)
    $cells += ,@{ Bitmap = $cell; Bounds = $bounds; OutputColumn = $entry.OutputColumn; OutputRow = $entry.OutputRow }
  }
  $scale = [Math]::Min(146 / $maxWidth, 146 / $maxHeight)
  $output = [Bitmap]::new($outputColumns * $cellSize, $outputRows * $cellSize, $pixelFormat)
  $canvas = [Graphics]::FromImage($output)
  $canvas.CompositingMode = [CompositingMode]::SourceCopy
  $canvas.Clear([Color]::Transparent)
  $canvas.CompositingMode = [CompositingMode]::SourceOver
  $canvas.InterpolationMode = [InterpolationMode]::HighQualityBicubic
  $canvas.PixelOffsetMode = [PixelOffsetMode]::HighQuality
  foreach ($entry in $cells) {
    $bounds = $entry.Bounds
    $width = [Math]::Max(1, [Math]::Round(($bounds.MaxX - $bounds.MinX + 1) * $scale))
    $height = [Math]::Max(1, [Math]::Round(($bounds.MaxY - $bounds.MinY + 1) * $scale))
    $left = $entry.OutputColumn * $cellSize + [Math]::Floor(($cellSize - $width) / 2)
    $top = $entry.OutputRow * $cellSize + $gutter
    $canvas.DrawImage(
      $entry.Bitmap,
      [Rectangle]::new($left, $top, $width, $height),
      [Rectangle]::new($bounds.MinX, $bounds.MinY, $bounds.MaxX - $bounds.MinX + 1, $bounds.MaxY - $bounds.MinY + 1),
      [GraphicsUnit]::Pixel
    )
    $entry.Bitmap.Dispose()
  }
  $canvas.Dispose()
  $source.Dispose()
  Clear-LowAlpha $output
  Remove-SmallAlphaComponents $output
  $temporary = "$outputPath.packed.png"
  [IO.File]::Delete($temporary)
  $output.Save($temporary, [ImageFormat]::Png)
  $output.Dispose()
  [IO.File]::Move($temporary, $outputPath, $true)
  Align-CharacterAtlas $outputPath $outputColumns $outputRows
}

function ConvertTo-SeamlessTile([Bitmap] $source) {
  # Move the source boundaries to the middle with a toroidal half-offset, then
  # heal that central cross with a wide cosine blend from the unshifted source.
  # The outer boundaries remain naturally adjacent source pixels; unlike edge
  # copying or mirrored quadrants this does not introduce a short visual period.
  $output = [Bitmap]::new($source.Width, $source.Height, $pixelFormat)
  $halfWidth = [Math]::Floor($source.Width / 2)
  $halfHeight = [Math]::Floor($source.Height / 2)
  $blendRadius = 52
  for ($y = 0; $y -lt $source.Height; $y++) {
    $shiftY = ($y + $halfHeight) % $source.Height
    $distanceY = [Math]::Abs($y - ($source.Height - 1) / 2)
    $blendY = if ($distanceY -lt $blendRadius) {
      0.5 + 0.5 * [Math]::Cos([Math]::PI * $distanceY / $blendRadius)
    } else { 0 }
    for ($x = 0; $x -lt $source.Width; $x++) {
      $shiftX = ($x + $halfWidth) % $source.Width
      $distanceX = [Math]::Abs($x - ($source.Width - 1) / 2)
      $blendX = if ($distanceX -lt $blendRadius) {
        0.5 + 0.5 * [Math]::Cos([Math]::PI * $distanceX / $blendRadius)
      } else { 0 }
      $blend = 1 - (1 - $blendX) * (1 - $blendY)
      $offset = $source.GetPixel($shiftX, $shiftY)
      $center = $source.GetPixel($x, $y)
      $output.SetPixel($x, $y, [Color]::FromArgb(
        255,
        [Math]::Round($offset.R * (1 - $blend) + $center.R * $blend),
        [Math]::Round($offset.G * (1 - $blend) + $center.G * $blend),
        [Math]::Round($offset.B * (1 - $blend) + $center.B * $blend)
      ))
    }
  }
  return $output
}

function Pack-TerrainAtlas([string] $sourcePath, [string] $outputPath) {
  $source = [Bitmap]::new($sourcePath)
  $output = [Bitmap]::new(512, 512, $pixelFormat)
  $canvas = [Graphics]::FromImage($output)
  $canvas.CompositingMode = [CompositingMode]::SourceCopy
  $canvas.Clear([Color]::Black)
  $canvas.CompositingMode = [CompositingMode]::SourceOver
  $canvas.InterpolationMode = [InterpolationMode]::HighQualityBicubic
  for ($row = 0; $row -lt 2; $row++) {
    for ($column = 0; $column -lt 2; $column++) {
      $cell = Get-SourceCell $source $column $row 2 2
      $margin = [Math]::Floor([Math]::Min($cell.Width, $cell.Height) * 0.04)
      $tile = [Bitmap]::new(256, 256, $pixelFormat)
      $graphics = [Graphics]::FromImage($tile)
      $graphics.InterpolationMode = [InterpolationMode]::HighQualityBicubic
      $graphics.DrawImage(
        $cell,
        [Rectangle]::new(0, 0, 256, 256),
        [Rectangle]::new($margin, $margin, $cell.Width - 2 * $margin, $cell.Height - 2 * $margin),
        [GraphicsUnit]::Pixel
      )
      $graphics.Dispose()
      $cell.Dispose()
      $seamless = ConvertTo-SeamlessTile $tile
      $canvas.DrawImageUnscaled($seamless, $column * 256, $row * 256)
      $seamless.Dispose()
      $tile.Dispose()
    }
  }
  $canvas.Dispose()
  $source.Dispose()
  $temporary = "$outputPath.packed.png"
  [IO.File]::Delete($temporary)
  $output.Save($temporary, [ImageFormat]::Png)
  $output.Dispose()
  [IO.File]::Move($temporary, $outputPath, $true)
}

$walk = Join-Path $assetRoot "veda-walk-atlas.png"
$idle = Join-Path $assetRoot "veda-idle-atlas.png"
$push = Join-Path $assetRoot "veda-push-atlas.png"
$environment = Join-Path $assetRoot "veda-environment-atlas.png"

$idleMapping = @(
  @{ SourceColumn = 0; SourceRow = 0; OutputColumn = 0; OutputRow = 0 },
  @{ SourceColumn = 1; SourceRow = 0; OutputColumn = 0; OutputRow = 1 },
  @{ SourceColumn = 2; SourceRow = 0; OutputColumn = 0; OutputRow = 2 },
  @{ SourceColumn = 3; SourceRow = 0; OutputColumn = 0; OutputRow = 3 }
)
$pushMapping = @()
for ($row = 0; $row -lt 4; $row++) {
  for ($column = 0; $column -lt 2; $column++) {
    $pushMapping += ,@{ SourceColumn = $column; SourceRow = $row; OutputColumn = $column; OutputRow = $row }
  }
}

if ($ForceGenerated -or -not (Test-AtlasDimensions $idle 192 768)) {
  Pack-CharacterAtlas (Join-Path $sourceRoot "veda-idle-raw.png") $idle 4 1 1 4 $idleMapping
}
if ($ForceGenerated -or -not (Test-AtlasDimensions $push 384 768)) {
  Pack-CharacterAtlas (Join-Path $sourceRoot "veda-push-raw.png") $push 2 4 2 4 $pushMapping
}
if ($ForceGenerated -or $ForceTerrain -or -not (Test-AtlasDimensions $environment 512 512)) {
  Pack-TerrainAtlas (Join-Path $sourceRoot "veda-terrain-raw.png") $environment
}

# Alignment only translates pixels; it never resamples an already-packed file.
Align-CharacterAtlas $walk 4 4
Align-CharacterAtlas $idle 1 4
Align-CharacterAtlas $push 2 4

Write-Output "Corrected Veda Phase 1 atlases under $assetRoot"
