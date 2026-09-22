using namespace System.Drawing
using namespace System.Drawing.Drawing2D
using namespace System.Drawing.Imaging

param(
  [string] $PackageRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"
$applicationRoot = (Resolve-Path (Join-Path $PackageRoot "../..")).Path
$atlasPath = Join-Path $PackageRoot "src/assets/veda-environment-atlas.png"
$outputRoot = Join-Path $applicationRoot "docs/concepts/vedas-great-escape"
$atlas = [Bitmap]::new($atlasPath)
$pixelFormat = [PixelFormat]::Format32bppArgb

function Write-RepeatSheet([int] $tileSize, [string] $name) {
  $panelSize = $tileSize * 3
  $sheet = [Bitmap]::new($panelSize * 2, $panelSize * 2, $pixelFormat)
  $graphics = [Graphics]::FromImage($sheet)
  $graphics.CompositingMode = [CompositingMode]::SourceCopy
  $graphics.Clear([Color]::Black)
  $graphics.CompositingMode = [CompositingMode]::SourceOver
  $graphics.InterpolationMode = if ($tileSize -eq 256) {
    [InterpolationMode]::NearestNeighbor
  } else {
    [InterpolationMode]::HighQualityBicubic
  }
  for ($variantRow = 0; $variantRow -lt 2; $variantRow++) {
    for ($variantColumn = 0; $variantColumn -lt 2; $variantColumn++) {
      $panelX = $variantColumn * $panelSize
      $panelY = $variantRow * $panelSize
      $sourceTile = $atlas.Clone(
        [Rectangle]::new($variantColumn * 256, $variantRow * 256, 256, 256),
        $pixelFormat
      )
      $nativePanel = [Bitmap]::new(768, 768, $pixelFormat)
      $nativeGraphics = [Graphics]::FromImage($nativePanel)
      for ($repeatY = 0; $repeatY -lt 3; $repeatY++) {
        for ($repeatX = 0; $repeatX -lt 3; $repeatX++) {
          $nativeGraphics.DrawImageUnscaled($sourceTile, $repeatX * 256, $repeatY * 256)
        }
      }
      $nativeGraphics.Dispose()
      if ($tileSize -eq 256) {
        $graphics.DrawImageUnscaled($nativePanel, $panelX, $panelY)
      } else {
        # Scale the complete repeat, not each cell independently, so the QA
        # image cannot introduce interpolation borders that runtime does not.
        $graphics.DrawImage(
          $nativePanel,
          [Rectangle]::new($panelX, $panelY, $panelSize, $panelSize),
          [Rectangle]::new(0, 0, 768, 768),
          [GraphicsUnit]::Pixel
        )
      }
      $nativePanel.Dispose()
      $sourceTile.Dispose()
    }
  }
  $graphics.Dispose()
  $path = Join-Path $outputRoot $name
  [IO.File]::Delete($path)
  $sheet.Save($path, [ImageFormat]::Png)
  $sheet.Dispose()
}

Write-RepeatSheet 256 "terrain-repeat-3x3-native.png"
Write-RepeatSheet 43 "terrain-repeat-3x3-phone.png"
$atlas.Dispose()
Write-Output "Wrote native and 43px terrain repeat inspection sheets under $outputRoot"
