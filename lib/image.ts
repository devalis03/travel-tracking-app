/**
 * Reads an image file chosen by the user and returns a square, centre-cropped
 * JPEG data URL. Downscaling keeps the stored avatar small enough for
 * localStorage, where the profile is persisted.
 */
export function fileToAvatarDataUrl(file: File, size = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      if (!side) {
        reject(new Error("That image could not be read."))
        return
      }

      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Your browser could not process this image."))
        return
      }

      const sx = (img.naturalWidth - side) / 2
      const sy = (img.naturalHeight - side) / 2
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("That image could not be read."))
    }

    img.src = objectUrl
  })
}
