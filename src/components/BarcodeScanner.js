import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const BarcodeScanner = ({ onDetected, onError, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  const stopScannerAndCamera = () => {
    console.log('Stopping scanner and camera...');
    if (codeReader.current) {
      console.log('Resetting ZXing reader...');
      codeReader.current.reset(); // Stops decoding and releases resources
    }
    if (streamRef.current) {
      console.log('Stopping camera stream...');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      console.log('Pausing video...');
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const startScanner = async () => {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        console.log('Camera stream acquired:', streamRef.current);

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded, playing...');
            video.play().catch(err => {
              console.error('Error playing video:', err);
              if (onError) onError(err);
            });
          };

          console.log('Starting ZXing barcode reader...');
          codeReader.current.decodeFromVideoDevice(
            undefined, // Use default device (environment-facing camera)
            video,
            (result, error) => {
              if (result) {
                console.log('Barcode detected:', result.getText());
                stopScannerAndCamera();
                onDetected(result.getText());
                onClose();
              }
              if (error) {
                // Log non-critical errors but don't stop unless fatal
                console.log('ZXing decode loop error:', error.name, error.message);
                if (error.name === 'NotFoundException') {
                  // Ignore "no barcode found" errors, as they're normal during scanning
                } else if (error.name === 'NotAllowedError') {
                  stopScannerAndCamera();
                  if (onError) onError(new Error('נא לאשר גישה למצלמה'));
                } else if (error.name === 'NotReadableError') {
                  stopScannerAndCamera();
                  if (onError) onError(new Error('לא ניתן לקרוא את המצלמה'));
                } else {
                  // Other unexpected errors
                  stopScannerAndCamera();
                  if (onError) onError(error);
                }
              }
            }
          );
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        if (onError) onError(error);
      }
    };

    startScanner();

    return () => {
      console.log('Cleaning up on unmount...');
      stopScannerAndCamera();
    };
  }, [onDetected, onError, onClose]);

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    color: 'white',
  };

  const scannerContainerStyles = {
    width: '80%',
    maxWidth: '400px',
    position: 'relative',
  };

  const videoStyles = {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
  };

  const closeButtonStyles = {
    marginBottom: '20px',
    backgroundColor: '#e74c3c',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
  };

  return (
    <div style={overlayStyles}>
      <button
        style={closeButtonStyles}
        onClick={() => {
          console.log('Close button clicked');
          stopScannerAndCamera();
          onClose();
        }}
      >
        סגור סריקה
      </button>
      <div style={scannerContainerStyles}>
        <video ref={videoRef} style={videoStyles} muted playsInline />
      </div>
      <p>אנא כוון את הברקוד למרכז המסך</p>
    </div>
  );
};

export default BarcodeScanner;