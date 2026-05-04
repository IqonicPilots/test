"use client"

/**
 * Utility to export a Recharts/SVG chart as an image (PNG or JPEG)
 */
export const exportAsImage = (id: string, format: 'png' | 'jpeg', filename: string) => {
  const container = document.getElementById(id)
  if (!container) return

  const svg = container.querySelector('svg')
  if (!svg) return

  // Clone SVG to modify it without affecting the UI
  const svgClone = svg.cloneNode(true) as SVGSVGElement
  const originalElements = svg.querySelectorAll('*')
  const clonedElements = svgClone.querySelectorAll('*')

  // Inject computed styles into the clone
  clonedElements.forEach((el, i) => {
    const originalEl = originalElements[i]
    const style = window.getComputedStyle(originalEl)

    // Map common color properties from computed style to inline style
    if (style.fill && style.fill !== 'none') (el as SVGElement).style.fill = style.fill
    if (style.stroke && style.stroke !== 'none') (el as SVGElement).style.stroke = style.stroke
    if (style.stopColor) (el as SVGElement).style.stopColor = style.stopColor

    // Ensure fonts are preserved
    if (style.fontSize) (el as SVGElement).style.fontSize = style.fontSize
    if (style.fontFamily) (el as SVGElement).style.fontFamily = style.fontFamily
    if (style.fontWeight) (el as SVGElement).style.fontWeight = style.fontWeight
    if (style.color) (el as SVGElement).style.color = style.color
  })

  // Add explicit dimensions if missing
  const bounds = svg.getBoundingClientRect()
  svgClone.setAttribute('width', bounds.width.toString())
  svgClone.setAttribute('height', bounds.height.toString())

  const svgData = new XMLSerializer().serializeToString(svgClone)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  img.onload = () => {
    // Use higher scale for better quality
    const scale = 2
    canvas.width = bounds.width * scale
    canvas.height = bounds.height * scale

    if (ctx) {
      // Clear and fill background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)

      const dataUrl = canvas.toDataURL(`image/${format}`, 1.0)
      const link = document.createElement('a')
      link.download = `${filename}.${format}`
      link.href = dataUrl
      link.click()
      URL.revokeObjectURL(url)
    }
  }
  img.src = url
}

/**
 * Utility to download data as CSV
 */
export const downloadCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? "")).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
