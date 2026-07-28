import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, CheckCircle2, Volume2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => { success: boolean; message: string; scanned?: number; total?: number } | void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentFacingMode, setCurrentFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScanBanner, setLastScanBanner] = useState<{ success: boolean; message: string } | null>(null);
  const [autoCloseOnMatch, setAutoCloseOnMatch] = useState<boolean>(true);
  const autoCloseRef = useRef<boolean>(true);

  useEffect(() => {
    autoCloseRef.current = autoCloseOnMatch;
  }, [autoCloseOnMatch]);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const isCoolingDownRef = useRef<boolean>(false);

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
          if (!isMounted || isCoolingDownRef.current) return;

          isCoolingDownRef.current = true;

          try {
            const res = onScanRef.current(decodedText);
            const isSuccess = res ? res.success : true;
            const msg = res ? res.message : `Verified: ${decodedText}`;

            setLastScanBanner({
              success: isSuccess,
              message: msg
            });

            if (isSuccess && autoCloseRef.current) {
              setTimeout(() => {
                if (isMounted) {
                  onClose();
                }
              }, 300);
              return;
            }
          } catch (err: any) {
            setLastScanBanner({
              success: false,
              message: err?.message || 'Scan error / mismatch'
            });
          }

          // Reset cooldown so same or next QR code can be scanned repeatedly
          setTimeout(() => {
            if (isMounted) {
              isCoolingDownRef.current = false;
            }
          }, 1000);
        };

        const onScanFailure = () => {
          // Frame failed to detect QR/Barcode - normal stream loop
        };

        try {
          await qrCode.start(
            { facingMode: currentFacingMode === 'environment' ? { exact: "environment" } : "user" },
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (exactErr) {
          try {
            await qrCode.start(
              { facingMode: currentFacingMode },
              config,
              onScanSuccess,
              onScanFailure
            );
          } catch (facingErr) {
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
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Continuous Camera Scanner</h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Keep camera on items to scan multiple units automatically
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cameras.length > 1 && (
              <button
                onClick={toggleCameraFacing}
                title="Switch Camera"
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Feedback Banner inside camera view */}
        {lastScanBanner && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b animate-in slide-in-from-top-1 ${
            lastScanBanner.success 
              ? 'bg-emerald-600 text-white border-emerald-700' 
              : 'bg-rose-600 text-white border-rose-700'
          }`}>
            {lastScanBanner.success ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="truncate">{lastScanBanner.message}</span>
          </div>
        )}

        {/* Camera Feed Container */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-slate-900/90 flex flex-col items-center justify-center text-white p-4">
              <RefreshCw size={28} className="animate-spin text-indigo-400 mb-2" />
              <p className="text-xs font-medium text-slate-300">Opening camera feed...</p>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-rose-500">
              <AlertCircle size={32} />
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={() => setCurrentFacingMode('environment')}
                className="mt-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Retry Back Camera
              </button>
            </div>
          ) : (
            <div id="qr-reader" className="w-full h-full"></div>
          )}
        </div>

        {/* Footer with Mode Toggle and Done Button */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCloseOnMatch}
              onChange={(e) => setAutoCloseOnMatch(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span>Auto-close camera on scan</span>
          </label>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
};

