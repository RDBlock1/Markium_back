"use client"

import { useState, useRef, useEffect } from "react"
import { X, Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface ImageFile {
    id: string
    file: File
    url: string
    name: string
    size: number
}

interface ImageUploadProps {
    onImagesChange: (images: ImageFile[]) => void
    maxImages?: number
    isMobile?: boolean
    initialImages?: ImageFile[]
}

export function ImageUpload({ onImagesChange, maxImages = 5, isMobile = false, initialImages = [] }: ImageUploadProps) {
    const [images, setImages] = useState<ImageFile[]>(initialImages)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setImages(initialImages)
    }, [initialImages])

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return

        const newImages: ImageFile[] = []
        const remainingSlots = maxImages - images.length

        for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
            const file = files[i]

            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file`)
                continue
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 10MB)`)
                continue
            }

            const imageFile: ImageFile = {
                id: `${Date.now()}-${i}`,
                file,
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            }

            newImages.push(imageFile)
        }

        if (newImages.length > 0) {
            const updatedImages = [...images, ...newImages]
            setImages(updatedImages)
            onImagesChange(updatedImages)
            toast.success(`${newImages.length} image(s) added`)
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeImage = (id: string) => {
        const updatedImages = images.filter((img) => {
            if (img.id === id) {
                URL.revokeObjectURL(img.url)
                return false
            }
            return true
        })
        setImages(updatedImages)
        onImagesChange(updatedImages)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    }

    return (
        <div className="space-y-3">
            {/* Upload Button */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= maxImages}
                    className={cn("flex items-center gap-2", isMobile ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm")}
                >
                    <Upload className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    {isMobile ? "Upload" : "Upload Images"}
                </Button>
                <span className={cn("text-gray-500", isMobile ? "text-xs" : "text-sm")}>
                    {images.length}/{maxImages}
                </span>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
            />

            {/* Image Previews */}
            {images.length > 0 && (
                <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-3")}>
                    {images.map((image) => (
                        <div key={image.id} className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            <div className={cn("aspect-square relative", isMobile ? "h-20" : "h-24")}>
                                <img
                                    src={image.url || "/placeholder.svg"}
                                    alt={image.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                                {/* Remove Button */}
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeImage(image.id)}
                                    className={cn(
                                        "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity",
                                        isMobile ? "h-6 w-6 p-0" : "h-7 w-7 p-0",
                                    )}
                                >
                                    <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                </Button>
                            </div>

                            {/* Image Info */}
                            <div className={cn("p-2 bg-white", isMobile ? "text-xs" : "text-sm")}>
                                <p className="font-medium text-gray-900 truncate">{image.name}</p>
                                <p className="text-gray-500">{formatFileSize(image.size)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Component for displaying images in chat messages
interface ChatImageProps {
    src: string
    alt: string
    isMobile?: boolean
}

export function ChatImage({ src, alt, isMobile = false }: ChatImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    return (
        <div className={cn("relative rounded-lg overflow-hidden bg-gray-100", isMobile ? "max-w-48" : "max-w-64")}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
            )}

            {hasError ? (
                <div className="flex items-center justify-center p-4 text-gray-500">
                    <ImageIcon className="h-8 w-8" />
                </div>
            ) : (
                <img
                    src={src || "/placeholder.svg"}
                    alt={alt}
                    className="w-full h-auto"
                    loading="lazy"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false)
                        setHasError(true)
                    }}
                />
            )}
        </div>
    )
}
