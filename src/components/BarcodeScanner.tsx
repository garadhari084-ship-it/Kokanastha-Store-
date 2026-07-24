import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentFacingMode, setCurrentFacingMode] = useState<'environment' | 'user'>('environment');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let isMounted = true;
    const scannerId = "qr-reader";

    const initScanner = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Get available camera devices
        try {
          const deviceList = await Html5Qrcode.getCameras();
          if (isMounted) {
            setCameras(deviceList.map(c => ({ id: c.id, label: c.label })));
          }
        } catch (e) {
          // Camera permission or listing error
        }

        const qrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = qrCode;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 260 }
        };

        const onScanSuccess = (decodedText: string) => {
          if (isMounted) {
            onScanRef.current(decodedText);
          }
        };

        const onScanFailure = () => {
          // Frame failed to detect QR/Barcode - normal stream loop
        };

        // Always attempt back camera first ({ facingMode: "environment" })
        try {
          await qrCode.start(
            { facingMode: currentFacingMode },
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (facingErr) {
          console.warn("Direct facingMode camera start failed, trying available cameras list:", facingErr);
          
          // Fallback: try finding back camera in cameras list or use default camera
          const available = await Html5Qrcode.getCameras();
          if (available && available.length > 0) {
            const backCam = available.find(c => 
              c.label.toLowerCase().includes('back') || 
              c.label.toLowerCase().includes('rear') || 
              c.label.toLowerCase().includes('environment')
            );
            const selectedCamId = backCam ? backCam.id : available[available.length - 1].id;
            
            await qrCode.start(
              selectedCamId,
              config,
              onScanSuccess,
              onScanFailure
            );
          } else {
            throw new Error("No camera found on this device.");
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsLoading(false);
          setError(err?.message || 'Unable to access camera. Please allow camera permissions.');
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
          }).catch(e => console.error("Error stopping barcode scanner:", e));
        } else {
          try {
            html5QrCodeRef.current.clear();
          } catch (e) {}
        }
      }
    };
  }, [currentFacingMode]);

  const toggleCameraFacing = async () => {
    if (html5QrCodeRef.current) {
      const state = html5QrCodeRef.current.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await html5QrCodeRef.current.stop();
      }
    }
    setCurrentFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Barcode Scanner</h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {currentFacingMode === 'environment' ? 'Back Camera Active' : 'Front Camera Active'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cameras.length > 1 && (
              <button
                onClick={toggleCameraFacing}
                title="Switch Camera"
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Camera Feed Container */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-slate-900/90 flex flex-col items-center justify-center text-white p-4">
              <RefreshCw size={28} className="animate-spin text-indigo-400 mb-2" />
              <p className="text-xs font-medium text-slate-300">Opening back camera...</p>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-rose-500">
              <AlertCircle size={32} />
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={() => setCurrentFacingMode('environment')}
                className="mt-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-lg transition-colors"
              >
                Retry Back Camera
              </button>
            </div>
          ) : (
            <div id="qr-reader" className="w-full h-full"></div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-between px-4">
          <p className="text-[11px] text-slate-500 font-medium">
            Point camera at barcode/QR code to scan
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            Auto-Detect
          </span>
        </div>
      </div>
    </div>
  );
};

