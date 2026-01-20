'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string;
  memberName: string;
}

export function QRCodeModal({ isOpen, onClose, qrCode, memberName }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current && qrCode) {
      QRCode.toCanvas(
        canvasRef.current,
        qrCode,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [isOpen, qrCode]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${memberName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">QR Kod</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <canvas ref={canvasRef} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{memberName}</p>
              <p className="text-xs text-gray-500 mt-1">Skenirajte kod na ulazu</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <Button
            onClick={handleDownload}
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Preuzmi
          </Button>
          <Button onClick={onClose} className="flex-1">
            Zatvori
          </Button>
        </div>
      </div>
    </div>
  );
}