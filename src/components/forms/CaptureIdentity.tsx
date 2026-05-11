import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Camera as CameraIcon, RefreshCcw, Eraser, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CaptureIdentityProps {
  mode: "photo" | "signature";
  onCapture: (data: string) => void;
  capturedData: string | null;
  onReset: () => void;
}

export function CapturePhoto({
  onCapture,
  capturedData,
  onReset
}: { onCapture: (data: string) => void; capturedData: string | null; onReset: () => void }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-brand-dark-grey">Identity Verification Capture</Label>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-brand-blue/5 border-2 border-dashed border-brand-blue/20">
        {capturedData ? (
          <div className="relative h-full">
            <img src={capturedData} alt="Captured identity" className="h-full w-full object-cover" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 h-7 bg-white/80 backdrop-blur"
              onClick={onReset}
            >
              <RefreshCcw className="h-3 w-3 mr-1" /> Retake
            </Button>
          </div>
        ) : isCameraActive ? (
          <div className="relative h-full">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover grayscale contrast-125" />
            <Button 
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-brand-blue font-black h-10 px-6 rounded-full shadow-xl"
            >
              Capture Verification
            </Button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <CameraIcon className="h-6 w-6 text-brand-blue" />
            </div>
            <p className="text-[10px] text-brand-dark-grey/60 max-w-[200px]">
              Camera access required for secure identity binding.
            </p>
            <Button onClick={startCamera} size="sm" variant="outline" className="border-brand-blue/20 text-brand-blue h-8">
              Initialize Camera
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaptureSignature({
  onCapture,
  capturedData,
  onReset
}: { onCapture: (data: string) => void; capturedData: string | null; onReset: () => void }) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const saveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      onCapture(sigCanvasRef.current.toDataURL());
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-brand-dark-grey">Registry Signature Binding</Label>
      <div className="border-2 border-dashed border-brand-blue/20 rounded-xl bg-white overflow-hidden relative">
        {capturedData ? (
          <div className="h-32 flex items-center justify-center p-2 relative bg-brand-blue/5">
            <img src={capturedData} alt="Signature" className="max-h-full max-w-full object-contain" />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-1 right-1 h-6 w-6 text-brand-blue hover:text-red-500"
              onClick={onReset}
            >
              <RefreshCcw className="h-3 w-3" />
            </Button>
            <div className="absolute top-1 left-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-[8px] font-black uppercase text-green-600 tracking-widest">Linked</span>
            </div>
          </div>
        ) : (
          <div className="h-32 relative">
            <SignatureCanvas 
              ref={sigCanvasRef}
              penColor="#1e68cf"
              canvasProps={{ className: "signature-canvas w-full h-full" }}
              onEnd={saveSignature}
            />
            <div className="absolute top-1 left-2 pointer-events-none">
              <span className="text-[10px] uppercase font-black text-brand-blue/20 tracking-widest italic">Electronic binding area</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { sigCanvasRef.current?.clear(); onReset(); }}
              className="absolute top-1 right-1 h-6 w-6 text-brand-blue hover:text-red-500 bg-white shadow-sm"
            >
              <Eraser className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaptureIdentity({
  mode,
  onCapture,
  capturedData,
  onReset
}: CaptureIdentityProps) {
  if (mode === "photo") {
    return <CapturePhoto onCapture={onCapture} capturedData={capturedData} onReset={onReset} />;
  }
  return <CaptureSignature onCapture={onCapture} capturedData={capturedData} onReset={onReset} />;
}
