'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Html5QrScannerProps {
  onScan: (result: { text: string }) => void;
  onError?: (error: any) => void;
}

export default function Html5QrScanner({ onScan, onError }: Html5QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  useEffect(() => {
    // Criar e inicializar o scanner
    const initializeScanner = async () => {
      if (!containerRef.current) return;
    
      try {
        setIsInitializing(true);
        
        // Identificador único para o scanner
        const scannerId = 'html5-qr-code-scanner';
        
        // Limpar qualquer scanner existente
        const existingElement = document.getElementById(scannerId);
        if (existingElement) {
          existingElement.remove();
        }
        
        // Criar novo container para o scanner
        const container = document.createElement('div');
        container.id = scannerId;
        container.style.width = '100%';
        container.style.height = '100%';
        containerRef.current.innerHTML = ''; // Limpar completamente o container
        containerRef.current.appendChild(container);
        
        // Inicializar o scanner
        console.log("Iniciando scanner de QR code...");
        scannerRef.current = new Html5Qrcode(scannerId, { 
          verbose: true // Ativar logs detalhados para debugging
        });
        
        // Definir o tamanho para melhorar a detecção
        const width = Math.min(containerRef.current.clientWidth, 500);
        const height = Math.min(containerRef.current.clientHeight, 400);
        
        console.log(`Dimensões do container: ${width}x${height}px`);
        
        // Iniciar a câmera com configurações avançadas para melhor detecção
        await scannerRef.current.start(
          { facingMode: 'environment' },  // Usar câmera traseira quando disponível
          {
            fps: 15, // Aumentar FPS para melhor detecção
            qrbox: { 
              width: Math.min(300, width - 50), 
              height: Math.min(300, height - 50) 
            },
            aspectRatio: 1.0,
            disableFlip: false, // Permitir flip da imagem para melhorar reconhecimento
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          },
          (decodedText) => {
            console.log("[QR-SCANNER] Código detectado:", decodedText);
            if (decodedText && decodedText.trim().length > 0) {
              onScan({ text: decodedText.trim() });
            } else {
              console.warn("[QR-SCANNER] Código detectado vazio");
            }
          },
          (errorMessage) => {
            // Log apenas dos erros de decodificação (não críticos)
            console.debug("[QR-SCANNER] Erro de decodificação:", errorMessage);
          }
        );
        
        // Garantir que o elemento de vídeo tenha estilo adequado
        setTimeout(() => {
          const videoElement = document.querySelector('#html5-qr-code-scanner video');
          if (videoElement) {
            console.log("[QR-SCANNER] Ajustando estilo do elemento de vídeo");
            (videoElement as HTMLElement).style.width = '100%';
            (videoElement as HTMLElement).style.height = 'auto';
            (videoElement as HTMLElement).style.maxHeight = '300px';
            (videoElement as HTMLElement).style.objectFit = 'contain';
          } else {
            console.warn("[QR-SCANNER] Elemento de vídeo não encontrado");
          }
          
          // Verificar se o scanner está ativo
          if (scannerRef.current) {
            console.log("[QR-SCANNER] Estado do scanner:", scannerRef.current.isScanning ? "ativo" : "inativo");
          }
        }, 500);
        
        console.log("Scanner QR iniciado com sucesso");
        setIsInitializing(false);
      } catch (error) {
        console.error("Erro ao inicializar scanner de QR code:", error);
        setIsInitializing(false);
        if (onError) onError(error);
      }
    };
    
    initializeScanner();
    
    // Cleanup ao desmontar
    return () => {
      if (scannerRef.current) {
        try {
          // Verificar se o scanner está ativo antes de tentar pará-lo
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop()
              .then(() => console.log("Scanner QR parado com sucesso"))
              .catch(err => console.error("Erro ao parar scanner:", err));
          } else {
            console.log("Scanner não está ativo, não é necessário parar");
          }
        } catch (err) {
          console.error("Erro ao verificar estado do scanner:", err);
        }
      }
    };
  }, [onScan, onError]);
  
  return (
    <div className="qr-scanner-container">
      {isInitializing && (
        <div className="scanner-loading">
          Inicializando câmera...
        </div>
      )}
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
          background-color: #f8f8f8;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .scanner-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.8);
          z-index: 10;
          font-weight: 500;
        }
        
        /* Garantir que o vídeo seja visível */
        :global(#html5-qr-code-scanner) {
          width: 100% !important;
          height: 100% !important;
          min-height: 300px !important;
        }
        
        :global(#html5-qr-code-scanner video) {
          width: 100% !important;
          height: auto !important;
          max-height: 300px !important;
          object-fit: contain !important;
        }
        
        /* Melhorar a visibilidade da área de escaneamento */
        :global(.qr-border) {
          border: 5px solid #4f46e5 !important;
          box-shadow: 0 0 0 5px rgba(79, 70, 229, 0.3) !important;
        }
      `}</style>
    </div>
  );
} 