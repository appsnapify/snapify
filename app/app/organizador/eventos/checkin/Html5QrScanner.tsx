'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Html5QrScannerProps {
  onScan: (result: { text: string }) => void;
  onError?: (error: any) => void;
}

export default function Html5QrScanner({ onScan, onError }: Html5QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scannerId = 'html5-qr-code-scanner';
    const createScanner = async () => {
      try {
        // Verificar se já existe um elemento com este ID para evitar duplicações
        if (document.getElementById(scannerId)) {
          const element = document.getElementById(scannerId);
          if (element) element.remove();
        }

        // Criar novo container
        const container = document.createElement('div');
        container.id = scannerId;
        containerRef.current?.appendChild(container);

        // Inicializar scanner
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        console.log('Iniciando scanner de câmera');
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log(`QR Code detectado: ${decodedText}`);
            onScan({ text: decodedText });
          },
          (errorMessage) => {
            console.log(`Erro no scanner (não crítico): ${errorMessage}`);
          }
        );
      } catch (error) {
        console.error('Erro ao inicializar scanner:', error);
        if (onError) onError(error);
      }
    };

    createScanner();

    // Cleanup: parar o scanner ao desmontar o componente
    return () => {
      console.log('Parando scanner de QR code...');
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => console.log('Scanner parado com sucesso'))
          .catch(err => console.error('Erro ao parar scanner:', err));
      }
    };
  }, [onScan, onError]);

  return (
    <div className="qr-scanner-container">
      <div ref={containerRef} className="scanner-area">
        {/* O scanner será renderizado aqui */}
      </div>
      <style jsx>{`
        .qr-scanner-container {
          width: 100%;
          min-height: 300px;
          position: relative;
        }
        .scanner-area {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
} 