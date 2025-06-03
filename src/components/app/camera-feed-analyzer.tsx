
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Camera, AlertTriangle, Sparkles, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeImageFrame } from '@/app/actions';
import type { AnalyzeCameraFrameOutput, FaceAnalysis } from '@/ai/flows/analyze-camera-frame-flow';

export default function CameraFeedAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null); // For capturing frame for AI
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // For drawing overlays
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCameraFrameOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const drawOverlays = useCallback((facesToDraw?: FaceAnalysis[]) => {
    const videoElement = videoRef.current;
    const canvasElement = overlayCanvasRef.current;
    const ctx = canvasElement?.getContext('2d');

    if (!ctx || !videoElement || !canvasElement) return;

    // Match canvas dimensions to video's displayed dimensions
    canvasElement.width = videoElement.clientWidth;
    canvasElement.height = videoElement.clientHeight;
    
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (!facesToDraw || facesToDraw.length === 0) {
      return;
    }

    ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)'; // Green color for boxes
    ctx.lineWidth = 2;
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'rgba(74, 222, 128, 0.9)'; // Green color for text

    facesToDraw.forEach(face => {
      if (face.boundingBox) {
        // Denormalize coordinates
        const x = face.boundingBox.x * canvasElement.width;
        const y = face.boundingBox.y * canvasElement.height;
        const width = face.boundingBox.width * canvasElement.width;
        const height = face.boundingBox.height * canvasElement.height;

        // Draw bounding box
        ctx.strokeRect(x, y, width, height);

        // Prepare text lines
        const textLines = [
          `Age: ${face.estimatedAgeRange}`,
          `Gender: ${face.estimatedGender}`,
          `Mood: ${face.observedMood}`,
          // `Behavior: ${face.observedBehavior}`, // Can be too long
        ];
        
        let textY = y + 12; // Start text inside the top of the box

        // Draw semi-transparent background for text
        const textPadding = 4;
        const lineHeight = 14;
        const textBlockHeight = textLines.length * lineHeight + textPadding;
        // Find max text width for background
        let maxTextWidth = 0;
        textLines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxTextWidth) {
                maxTextWidth = metrics.width;
            }
        });
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black background
        ctx.fillRect(x, y, maxTextWidth + textPadding * 2, textBlockHeight);


        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; // White text for better contrast
        for (const line of textLines) {
          // Adjust textY if it goes off top, or place below box
          if (y + textBlockHeight > canvasElement.height && y - textBlockHeight - 5 > 0){ // if text box goes off bottom and there is space on top
             textY = y - textBlockHeight + 10; // Shift all text above box
          } else if (textY < 15 && y + height + textBlockHeight + 5 < canvasElement.height) { // if text box goes off top and there is space on bottom
            textY = y + height + 15; // Shift all text below box
          } else {
            // Default positioning: inside top of box or just above
             textY = (textLines.indexOf(line) === 0) ? y + lineHeight - textPadding : textY;
          }
          ctx.fillText(line, x + textPadding, textY);
          textY += lineHeight;
        }
        ctx.fillStyle = 'rgba(74, 222, 128, 0.9)'; // Reset fillStyle for next face if needed
      }
    });
  }, []);


  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      // Clear overlays when component unmounts
      const canvasElement = overlayCanvasRef.current;
      const ctx = canvasElement?.getContext('2d');
      if(ctx && canvasElement) {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      }
    };
  }, [toast]);

  useEffect(() => {
    if (analysisResult && videoRef.current && overlayCanvasRef.current) {
      drawOverlays(analysisResult.faces);
    }
  }, [analysisResult, drawOverlays]);

  // Redraw overlays if window is resized
  useEffect(() => {
    const handleResize = () => {
      if (analysisResult && videoRef.current && overlayCanvasRef.current) {
        // A short timeout helps ensure video dimensions are stable after resize
        setTimeout(() => drawOverlays(analysisResult.faces), 50);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [analysisResult, drawOverlays]);


  const captureFrameAndAnalyze = async () => {
    if (!videoRef.current || !captureCanvasRef.current || !hasCameraPermission) {
      toast({
        variant: 'destructive',
        title: 'Cannot Capture Frame',
        description: 'Camera not ready or permission denied.',
      });
      return;
    }

    setIsLoading(true);
    // Clear previous overlays before new analysis
    const overlayCtx = overlayCanvasRef.current?.getContext('2d');
    if(overlayCtx && overlayCanvasRef.current) overlayCtx.clearRect(0,0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    setAnalysisResult(null); // Clear previous results from text display
    setError(null);

    const video = videoRef.current;
    const canvas = captureCanvasRef.current; // Use capture canvas for AI
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError("Could not get canvas context for capture.");
      setIsLoading(false);
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await analyzeImageFrame(imageDataUri);
      if ('error' in result) {
        setError(result.error);
        setAnalysisResult(null);
        toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
      } else {
        setAnalysisResult(result); // This will trigger the useEffect to drawOverlays
        setError(null);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unknown error occurred during analysis.";
      setError(errorMsg);
      setAnalysisResult(null);
      toast({ variant: 'destructive', title: 'Analysis Exception', description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl bg-card/80 border border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-purple-500 flex items-center">
          <Camera className="mr-3 h-7 w-7" />
          Live Feed Facial Analysis
        </CardTitle>
        <CardDescription className="font-code text-muted-foreground/80">
          Capture a frame for AI-powered facial insights. Results will overlay on the video.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border border-border">
          <video
            ref={videoRef}
            className="w-full h-full object-cover block" // Ensure video is block for correct layout
            autoPlay
            playsInline
            muted
            onLoadedData={() => { // Redraw if video resizes itself (e.g. on initial load)
                 if (analysisResult && videoRef.current && overlayCanvasRef.current) {
                    setTimeout(() => drawOverlays(analysisResult.faces), 50);
                }
            }}
          />
          <canvas 
            ref={overlayCanvasRef} 
            className="absolute top-0 left-0 w-full h-full pointer-events-none" // Overlay canvas
          />
          <canvas ref={captureCanvasRef} className="hidden"></canvas> {/* Hidden canvas for capture */}
          
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
              <VideoOff className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">Camera Access Denied</p>
              <p className="text-sm text-center">Please enable camera permissions in your browser settings and refresh.</p>
            </div>
          )}
           {hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="text-lg">Initializing Camera...</p>
            </div>
          )}
        </div>

        {hasCameraPermission === false && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Camera Permission Required</AlertTitle>
            <AlertDescription>
              This tool needs access to your camera. Grant permission and refresh.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={captureFrameAndAnalyze}
          disabled={isLoading || hasCameraPermission !== true}
          className="w-full h-12 text-lg bg-purple-500 hover:bg-purple-600 text-primary-foreground font-code shadow-md hover:shadow-lg transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ANALYZING FRAME...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Capture & Analyze Faces
            </>
          )}
        </Button>

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysisResult && !isLoading && !error && (
          <Card className="mt-4 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-headline text-purple-500 flex items-center">
                <Sparkles className="mr-2 h-5 w-5" />
                AI Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-code text-muted-foreground">
                {analysisResult.detectionSummary}
              </p>
              {(!analysisResult.faces || analysisResult.faces.length === 0) && analysisResult.detectionSummary.toLowerCase().includes("no") && (
                 <p className="font-code text-sm text-muted-foreground mt-2">No faces were clearly detected or analyzed in this frame for overlay.</p>
              )}
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground/70 font-code">
                    Facial analysis details (age, gender, mood, bounding box) are estimations provided by an AI model and may not be fully accurate. Use with discretion. Overlays are based on the last captured frame.
                </p>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

