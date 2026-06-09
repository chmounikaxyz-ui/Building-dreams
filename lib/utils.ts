import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function optimizeImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.92): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.naturalWidth
        let height = img.naturalHeight

        // Only scale down if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        // Try progressively lower quality until it fits in ~3MB (localStorage safe)
        const maxBytes = 3 * 1024 * 1024
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg"
        let q = quality
        let result = canvas.toDataURL(mimeType, q)

        // For PNGs, just return as-is (no quality param applies)
        if (mimeType === "image/png") {
          resolve(result)
          return
        }

        // Keep reducing quality until size is acceptable
        while (result.length > maxBytes && q > 0.5) {
          q -= 0.05
          result = canvas.toDataURL("image/jpeg", q)
        }

        resolve(result)
      }
      img.onerror = () => {
        // Fallback: return original file as-is
        resolve(e.target?.result as string)
      }
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const categoryPlaceholders: Record<string, string> = {
  cement: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&fit=crop",
  sand: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&fit=crop",
  steel: "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400&fit=crop",
  bricks: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&fit=crop",
  pipes: "https://images.unsplash.com/photo-1608613304899-ea8098577e38?w=400&fit=crop",
  electrical: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&fit=crop",
  paint: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop",
  other: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&fit=crop",
}

export function getCategoryPlaceholder(category: string): string {
  const cat = (category || "").toLowerCase()
  return categoryPlaceholders[cat] || categoryPlaceholders.other
}

export function resolveProductImage(image: string, category: string): string {
  if (!image || image.includes("photo-1504307651254-35680f356dfd")) {
    return getCategoryPlaceholder(category)
  }
  return image
}
