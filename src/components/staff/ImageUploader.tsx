import { useRef, useState } from 'react'
import { uploadToCloudinary } from '../../lib/cloudinary'

interface Props {
  imageUrl: string
  onUpload: (url: string) => void
}

export function ImageUploader({ imageUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    setSheet(false)
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadToCloudinary(file)
      onUpload(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Tappable thumbnail */}
      <button
        type="button"
        onClick={() => setSheet(true)}
        className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"
      >
        {uploading ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <div className="absolute bottom-1 right-1 bg-green-600 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Hidden file inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*"
        className="hidden" onChange={e => handleFile(e.target.files?.[0])} />

      {/* Bottom sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-2xl p-4 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-700 text-center mb-1">Add Image</p>
            <button
              onClick={() => { setSheet(false); setTimeout(() => cameraRef.current?.click(), 50) }}
              className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>
            <button
              onClick={() => { setSheet(false); setTimeout(() => galleryRef.current?.click(), 50) }}
              className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload from Gallery
            </button>
            <button onClick={() => setSheet(false)}
              className="w-full text-sm text-gray-400 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
