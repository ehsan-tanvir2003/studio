
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Camera, AlertTriangle, Sparkles, VideoOff, Smile, UserCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeImageFrame } from '@/app/actions';
import type { AnalyzeCameraFrameOutput, FaceAnalysis } from '@/ai/flows/analyze-camera-frame-flow'; // Import new types
import { Badge } from '@/components/ui/badge';

export default function CameraFeedAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCameraFrameOutput | null>(null); // Updated type
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    };
  }, [toast]);

  const captureFrameAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !hasCameraPermission) {
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
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError("Could not get canvas context.");
      setIsLoading(false);
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await analyzeImageFrame(imageDataUri);
      if ('error' in result) { // Check if the result is an error object
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

  const FaceDetailCard: React.FC<{ face: FaceAnalysis, index: number }> = ({ face, index }) => (
    <Card className="bg-muted/30 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-headline text-purple-600 flex items-center">
          <UserCircle className="mr-2 h-5 w-5" />
          Detected Face #{index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm font-code space-y-1">
        <p><strong>Est. Age:</strong> {face.estimatedAgeRange}</p>
        <p><strong>Est. Gender:</strong> {face.estimatedGender}</p>
        <p><strong>Observed Mood:</strong> <Badge variant="secondary" className="bg-purple-100 text-purple-700">{face.observedMood}</Badge></p>
        <p><strong>Observed Behavior:</strong> {face.observedBehavior}</p>
      </CardContent>
    </Card>
  );


  return (
    <Card className="w-full shadow-xl bg-card/80 border border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-purple-500 flex items-center">
          <Camera className="mr-3 h-7 w-7" />
          Live Feed Facial Analysis
        </CardTitle>
        <CardDescription className="font-code text-muted-foreground/80">
          Capture a frame to get AI-powered insights about faces in the video.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border border-border">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden"></canvas>
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
              <VideoOff className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">Camera Access Denied</p>
              <p className="text-sm text-center">Please enable camera permissions in your browser settings.</p>
            </div>
          )}
           {hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
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
              This tool needs access to your camera to function. Please grant permission in your browser settings and refresh the page.
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
            <CardHeader>
              <CardTitle className="text-xl font-headline text-purple-500 flex items-center">
                <Sparkles className="mr-2 h-5 w-5" />
                AI Facial Analysis Report
              </CardTitle>
              <CardDescription className="font-code text-muted-foreground pt-1">
                {analysisResult.detectionSummary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisResult.faces && analysisResult.faces.length > 0 ? (
                analysisResult.faces.map((face, index) => (
                  <FaceDetailCard key={index} face={face} index={index} />
                ))
              ) : (
                <p className="text-muted-foreground font-code text-center py-4">
                  {analysisResult.detectionSummary.includes("No clearly analyzable faces") || analysisResult.faces?.length === 0 
                    ? "No faces were detected or analyzed in this frame." 
                    : "Waiting for face data..."}
                </p>
              )}
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground/70 font-code">
                    Facial analysis details are estimations provided by an AI model and may not be fully accurate. Use with discretion.
                </p>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
