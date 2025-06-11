
"use client";

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button'; // Keep this import
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

    if (isLoading) { // If loading, don't draw face boxes, a loading message is handled by captureFrameAndAnalyze
        return;
    }

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
        
        let textYPosition = y + 12; // Start text inside the top of the box

        // Draw semi-transparent background for text
        const textPadding = 4;
        const lineHeight = 14;
        const textBlockHeight = textLines.length * lineHeight + textPadding;
        
        let maxTextWidth = 0;
        textLines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxTextWidth) {
                maxTextWidth = metrics.width;
            }
        });
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black background
        ctx.fillRect(x, y, Math.max(width,maxTextWidth + textPadding * 2) , textBlockHeight);


        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; // White text for better contrast
        textLines.forEach((line, index) => {
          textYPosition = y + (index * lineHeight) + lineHeight - textPadding; // Position each line correctly
          ctx.fillText(line, x + textPadding, textYPosition);
        });
        ctx.fillStyle = 'rgba(74, 222, 128, 0.9)'; // Reset fillStyle for next face if needed
      }
    });
  }, [isLoading]); // Added isLoading to dependencies


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
      const canvasElement = overlayCanvasRef.current;
      const ctx = canvasElement?.getContext('2d');
      if(ctx && canvasElement) {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      }
    };
  }, [toast]);

  useEffect(() => {
    // This effect specifically handles drawing overlays when analysisResult changes or isLoading becomes false
    if (!isLoading && analysisResult && videoRef.current && overlayCanvasRef.current) {
        drawOverlays(analysisResult.faces);
    } else if (!isLoading) { // If not loading and no results (e.g. error or cleared)
        drawOverlays([]); // Clear overlays
    }
  }, [analysisResult, isLoading, drawOverlays]);


  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current && overlayCanvasRef.current) {
        setTimeout(() => {
            if (!isLoading && analysisResult) { // Only redraw face boxes if not loading and results exist
                 drawOverlays(analysisResult.faces);
            } else if (isLoading && overlayCanvasRef.current && videoRef.current) { // Redraw loading message on resize
                const overlayCanvas = overlayCanvasRef.current;
                const overlayCtx = overlayCanvas.getContext('2d');
                if (overlayCtx && videoRef.current) {
                    overlayCanvas.width = videoRef.current.clientWidth;
                    overlayCanvas.height = videoRef.current.clientHeight;
                    overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                    overlayCtx.fillStyle = 'white';
                    overlayCtx.font = '16px Arial';
                    overlayCtx.textAlign = 'center';
                    overlayCtx.textBaseline = 'middle';
                    overlayCtx.fillText('Analyzing Frame...', overlayCanvas.width / 2, overlayCanvas.height / 2);
                }
            } else { // If not loading and no results, ensure canvas is clear
                drawOverlays([]);
            }
        }, 50);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [analysisResult, isLoading, drawOverlays]);


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
    setAnalysisResult(null); 
    setError(null);

    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current; 
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const captureContext = captureCanvas.getContext('2d');
    if (!captureContext) {
      setError("Could not get canvas context for capture.");
      setIsLoading(false);
      return;
    }
    captureContext.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    const imageDataUri = captureCanvas.toDataURL('image/jpeg');

    // Draw loading message on overlay canvas
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas && videoRef.current) {
        const overlayCtx = overlayCanvas.getContext('2d');
        if (overlayCtx) {
            overlayCanvas.width = videoRef.current.clientWidth;
            overlayCanvas.height = videoRef.current.clientHeight;
            overlayCtx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height); // Clear previous drawings
            overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            overlayCtx.fillStyle = 'white';
            overlayCtx.font = 'bold 16px Arial';
            overlayCtx.textAlign = 'center';
            overlayCtx.textBaseline = 'middle';
            overlayCtx.fillText('Analyzing Frame...', overlayCanvas.width / 2, overlayCanvas.height / 2);
        }
    }


    try {
      const result = await analyzeImageFrame(imageDataUri);
      if ('error' in result) {
        setError(result.error);
        setAnalysisResult(null);
        toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
      } else {
        setAnalysisResult(result); 
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
            className="w-full h-full object-cover block" 
            autoPlay
            playsInline
            muted
            onLoadedData={() => { 
                 if (videoRef.current && overlayCanvasRef.current) {
                    setTimeout(() => {
                        if (!isLoading && analysisResult) {
                             drawOverlays(analysisResult.faces);
                        } else if (isLoading) {
                            // Re-draw loading message if video resizes during loading
                             const overlayCanvas = overlayCanvasRef.current;
 if (overlayCanvas && videoRef.current) {                            const overlayCtx = overlayCanvas.getContext('2d');                            if (overlayCtx) {
                                overlayCanvas.width = videoRef.current.clientWidth;
                                overlayCanvas.height = videoRef.current.clientHeight;
                                overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                                overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                                overlayCtx.fillStyle = 'white';
                                overlayCtx.font = 'bold 16px Arial';
                                overlayCtx.textAlign = 'center';
                                overlayCtx.textBaseline = 'middle';
                                overlayCtx.fillText('Analyzing Frame...', overlayCanvas.width / 2, overlayCanvas.height / 2);
                            }
                        }
                    }, 50);
                }
            }}
          />
          <canvas 
            ref={overlayCanvasRef} 
            className="absolute top-0 left-0 w-full h-full pointer-events-none" 
          />
          <canvas ref={captureCanvasRef} className="hidden"></canvas> 
          
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
              <VideoOff className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">Camera Access Denied</p>
              <p className="text-sm text-center">Please enable camera permissions in your browser settings and refresh.</p>
            </div>
          )}
           {hasCameraPermission === null && !isLoading && ( // only show if not also loading camera
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

