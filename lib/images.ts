/**
 * Reads an image file and returns a downscaled JPEG data URL. Photos live in
 * browser storage, so they are capped in size to keep many of them savable.
 */
export function imageFileToDataUrl(file: File, maxDimension = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read the file"))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error("Unsupported image"))
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext("2d")
        if (!context) {
          reject(new Error("Canvas unavailable"))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
