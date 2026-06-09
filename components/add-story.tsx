"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { X, Camera, Image as ImageIcon, Type, ChevronLeft, Send, RotateCcw } from "lucide-react"
import { cn, optimizeImage } from "@/lib/utils"

interface AddStoryProps {
  isOpen: boolean
  onClose: () => void
  onStoryAdded: (imageUrl: string, caption: string) => void
}

type Step = "select" | "camera" | "edit"

export function AddStory({ isOpen, onClose, onStoryAdded }: AddStoryProps) {
  const [step, setStep] = useState<Step>("select")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [showCaption, setShowCaption] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment")
  const [cameraError, setCameraError] = useState("")
  const [isFlashing, setIsFlashing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    stopCamera()
    setCameraError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setCameraError("Camera access denied. Use gallery instead.")
    }
  }, [stopCamera])

  useEffect(() => {
    if (step === "camera") startCamera(cameraFacing)
    else stopCamera()
    return stopCamera
  }, [step, cameraFacing])

  useEffect(() => {
    if (!isOpen) {
      setStep("select")
      setCapturedImage(null)
      setCaption("")
      setShowCaption(false)
      stopCamera()
    }
  }, [isOpen])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    setIsFlashing(true)
    const v = videoRef.current
    const c = canvasRef.current
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext("2d")!
    if (cameraFacing === "user") { ctx.translate(c.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(v, 0, 0)
    setCapturedImage(c.toDataURL("image/jpeg", 0.92))
    stopCamera()
    setStep("edit")
    setTimeout(() => setIsFlashing(false), 200)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const optimized = await optimizeImage(file, 1080, 1920, 0.95)
      setCapturedImage(optimized)
      setStep("edit")
    } catch (err) {
      console.error(err)
    }
    e.target.value = ""
  }

  const handleShare = () => {
    if (!capturedImage) return
    onStoryAdded(capturedImage, caption)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <div className="relative w-full max-w-[390px] h-full max-h-[100dvh] bg-black flex flex-col overflow-hidden">

      {/* ── SELECT ── */}
      {step === "select" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-6">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold text-base">Your Story</span>
            <div className="w-10" />
          </div>

          {/* Preview ring */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 via-violet-500 to-fuchsia-400 p-[3px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <Camera className="w-10 h-10 text-white/40" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary rounded-full flex items-center justify-center border-2 border-black">
                <span className="text-white text-xl font-light leading-none">+</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-white text-2xl font-bold">Add to Story</h2>
              <p className="text-white/50 text-sm">Share a moment — visible for 24 hours</p>
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={() => setStep("camera")}
                className="w-full flex items-center gap-4 bg-white/10 active:bg-white/20 rounded-2xl px-5 py-4 transition-colors"
              >
                <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Camera</p>
                  <p className="text-white/40 text-xs">Take a photo or video</p>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 bg-white/10 active:bg-white/20 rounded-2xl px-5 py-4 transition-colors"
              >
                <div className="w-11 h-11 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Gallery</p>
                  <p className="text-white/40 text-xs">Choose from your photos</p>
                </div>
              </button>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
        </>
      )}

      {/* ── CAMERA ── */}
      {step === "camera" && (
        <>
          <div className="relative flex-1 bg-black overflow-hidden">
            {/* Flash effect */}
            {isFlashing && <div className="absolute inset-0 bg-white z-20 pointer-events-none" />}

            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
                <Camera className="w-16 h-16 text-white/20" />
                <p className="text-white/50 text-center text-sm">{cameraError}</p>
                <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-white px-8 py-3 rounded-full font-semibold text-sm">
                  Open Gallery
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className={cn("absolute inset-0 w-full h-full object-cover", cameraFacing === "user" && "scale-x-[-1]")}
              />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
              <button onClick={() => { stopCamera(); setStep("select") }} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button onClick={() => setCameraFacing(f => f === "user" ? "environment" : "user")} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Shutter */}
          <div className="bg-black flex items-center justify-center py-10 gap-12">
            <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={capturePhoto}
              disabled={!!cameraError}
              className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
            <div className="w-12 h-12" />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}

      {/* ── EDIT ── */}
      {step === "edit" && capturedImage && (
        <>
          <div className="relative flex-1 overflow-hidden">
            <img src={capturedImage} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
              <button onClick={() => { setCapturedImage(null); setStep("select") }} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCaption(v => !v)}
                  className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", showCaption ? "bg-primary" : "bg-black/50")}
                >
                  <Type className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Caption input */}
            {showCaption && (
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 z-10">
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={150}
                  autoFocus
                  rows={2}
                  className="w-full bg-black/60 backdrop-blur-md text-white placeholder-white/50 text-center text-lg font-semibold rounded-2xl p-4 resize-none border border-white/20 outline-none"
                />
              </div>
            )}

            {/* Caption display */}
            {!showCaption && caption && (
              <div className="absolute bottom-28 inset-x-6 z-10 pointer-events-none">
                <p className="text-white text-center text-lg font-semibold drop-shadow-lg">{caption}</p>
              </div>
            )}
          </div>

          {/* Share bar */}
          <div className="bg-black px-5 py-5 flex items-center gap-3">
            <div
              onClick={() => setShowCaption(true)}
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white/40 text-sm cursor-text"
            >
              {caption || "Add a caption..."}
            </div>
            <button
              onClick={handleShare}
              className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
            >
              <Send className="w-6 h-6 text-white" />
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
