const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

export function compressImage(file: File, maxPx = 800, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height * maxPx) / width); width = maxPx }
        else { width = Math.round((width * maxPx) / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Compression failed')); return }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
      }, 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = url
  })
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const compressed = await compressImage(file)
  const fd = new FormData()
  fd.append('file', compressed)
  fd.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed')
  // Insert auto-enhance transformations into the delivery URL
  const url = data.secure_url as string
  return url.replace('/upload/', '/upload/e_auto_brightness,e_vibrance:30,e_sharpen:50/')
}
