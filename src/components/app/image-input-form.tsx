
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, Camera, XCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface ImageInputFormProps {
  onImageReady: (dataUri: string | null) => void;
  isLoading: boolean;
}

export default function ImageInputForm({ onImageReady, isLoading }: ImageInputFormProps) {
  const [previewDataUri, setPreviewDataUri] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'upload' | 'camera'>('idle');
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, [videoRef, setIsCapturing]);

  const resetState = useCallback(() => {
    setPreviewDataUri(null);
    setFileError(null);
    setCameraError(null);
    onImageReady(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
    stopCamera(); // Use the memoized stopCamera
    setIsCapturing(false);
    setMode('idle');
  }, [onImageReady, stopCamera]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    setPreviewDataUri(null);
    onImageReady(null);

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`Max image size is 5MB. File is ${(file.size / (1024*1024)).toFixed(2)}MB.`);
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setFileError("Only .jpg, .jpeg, .png, and .webp formats are accepted.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreviewDataUri(dataUri);
        onImageReady(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // videoRef.current.play() is handled by the useEffect below and autoPlay on the tag
        }
        setIsCapturing(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCameraPermission(false);
        const error = err as Error;
        let specificErrorMsg = `Error accessing camera: ${error.message}. Try refreshing or check browser permissions.`;
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            specificErrorMsg = "Camera permission denied. Please enable camera access in your browser settings.";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError"){
            specificErrorMsg = "No camera found. Please ensure a camera is connected and enabled.";
        }
        setCameraError(specificErrorMsg);
        toast({
          variant: "destructive",
          title: "Camera Access Issue",
          description: specificErrorMsg,
        });
        setIsCapturing(false);
        setMode('idle');
      }
    } else {
      const unsupportedMsg = "Camera access not supported by this browser.";
      setCameraError(unsupportedMsg);
      toast({ variant: "destructive", title: "Unsupported Browser", description: unsupportedMsg });
      setIsCapturing(false);
      setMode('idle');
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        setPreviewDataUri(dataUri);
        onImageReady(dataUri);
        stopCamera();
        setMode('idle'); 
      }
    }
  };
  
  useEffect(() => {
    // Cleanup camera stream when component unmounts or mode changes from camera
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Effect to handle video play when isCapturing becomes true and videoRef is available
  useEffect(() => {
    if (isCapturing && videoRef.current) {
      videoRef.current.setAttribute('autoplay', '');
      videoRef.current.setAttribute('muted', '');
      videoRef.current.setAttribute('playsinline', '');
      videoRef.current.play().catch(err => {
          console.warn("Video play interrupted or failed:", err);
      });
    }
  }, [isCapturing]);


  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center h-48 bg-muted/20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3"/>
            <p className="text-muted-foreground font-code">Processing previous request...</p>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      {!previewDataUri && mode === 'idle' && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setMode('upload')} variant="outline" className="flex-1 h-12 text-base font-code">
            <UploadCloud className="mr-2 h-5 w-5" /> Upload Image
          </Button>
          <Button onClick={() => { setMode('camera'); startCamera(); }} variant="outline" className="flex-1 h-12 text-base font-code">
            <Camera className="mr-2 h-5 w-5" /> Use Camera
          </Button>
        </div>
      )}

      {mode === 'upload' && !previewDataUri && (
        <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg text-center bg-background space-y-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handleFileChange}
            className="font-code bg-input/50 focus:bg-input border-border focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          <Button onClick={() => setMode('idle')} variant="ghost" size="sm" className="text-xs">Cancel Upload</Button>
        </div>
      )}
      
      {mode === 'camera' && isCapturing && hasCameraPermission && (
        <div className="space-y-4">
          <div className="border-2 border-primary/50 rounded-lg overflow-hidden shadow-md">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay playsInline muted />
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="flex gap-4">
            <Button onClick={captureImage} className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="mr-2 h-5 w-5" /> Capture Photo
            </Button>
            <Button onClick={() => { stopCamera(); setMode('idle'); }} variant="outline" className="flex-1 h-11">
              <XCircle className="mr-2 h-5 w-5" /> Cancel Camera
            </Button>
          </div>
        </div>
      )}
      
      {(cameraError || (mode === 'camera' && hasCameraPermission === false && !isCapturing)) && (
         <Alert variant="destructive">
            <Camera className="h-5 w-5" />
            <AlertTitle>Camera Error</AlertTitle>
            <AlertDescription>{cameraError || "Could not initialize camera. Please check permissions and ensure a camera is available."}</AlertDescription>
            <Button onClick={() => { setCameraError(null); setHasCameraPermission(null); setMode('idle'); }} variant="ghost" size="sm" className="mt-2 text-xs">Try Again</Button>
        </Alert>
      )}


      {fileError && (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>File Error</AlertTitle>
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      {previewDataUri && (
        <div className="space-y-4 p-4 border border-green-500/50 rounded-lg bg-green-500/5_shadow-md">
          <p className="text-sm font-code text-green-700 dark:text-green-400 font-semibold flex items-center">
            <CheckCircle className="w-5 h-5 mr-2"/> Image Ready for Use:
          </p>
          <div className="flex justify-center">
            <Image
              src={previewDataUri}
              alt="Uploaded or captured preview"
              width={200}
              height={200}
              className="rounded-md border-2 border-muted-foreground/20 object-contain max-h-60 shadow-sm"
              data-ai-hint="image preview"
            />
          </div>
          <Button onClick={resetState} variant="outline" size="sm" className="w-full text-xs font-code">
            <RefreshCw className="mr-2 h-4 w-4" /> Change Image (Upload/Capture New)
          </Button>
        </div>
      )}
    </div>
  );
}
