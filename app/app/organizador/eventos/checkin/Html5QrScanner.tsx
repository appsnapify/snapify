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
    // Criar e inicializar o scanner
    const initializeScanner = async () => {
      if (!containerRef.current) return;
    
      try {
        // Identificador único para o scanner
        const scannerId = 'html5-qr-code-scanner';
        
        // Limpar qualquer scanner existente
        if (document.getElementById(scannerId)) {
          document.getElementById(scannerId)?.remove();
        }
        
        // Criar novo container para o scanner
        const container = document.createElement('div');
        container.id = scannerId;
        containerRef.current.appendChild(container);
        
        // Inicializar o scanner
        console.log("Iniciando scanner de QR code...");
        scannerRef.current = new Html5Qrcode(scannerId);
        
        // Iniciar a câmera com configurações simples
        await scannerRef.current.start(
          { facingMode: 'environment' },  // Usar câmera traseira quando disponível
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText) => {
            console.log("QR Code detectado:", decodedText);
            onScan({ text: decodedText.trim() });
          },
          (errorMessage) => {
            // Ignorar erros não críticos durante o scanning
          }
        );
        
        console.log("Scanner QR iniciado com sucesso");
      } catch (error) {
        console.error("Erro ao inicializar scanner de QR code:", error);
        if (onError) onError(error);
      }
    };
    
    initializeScanner();
    
    // Cleanup ao desmontar
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
            .then(() => console.log("Scanner QR parado com sucesso"))
            .catch(err => console.error("Erro ao parar scanner:", err));
        } catch (err) {
          console.error("Erro ao tentar parar scanner:", err);
        }
      }
    };
  }, [onScan, onError]);
  
  return (
    <div className="qr-scanner-container">
      <div ref={containerRef} className="scanner-area" />
      
      <style jsx>{`
        .qr-scanner-container {
          width: 100%;
          min-height: 350px;
          position: relative;
        }
        
        .scanner-area {
          width: 100%;
          height: 100%;
          min-height: 350px;
          background-color: #f5f5f5;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
} 