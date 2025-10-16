import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  className = "",
  alt = "QR Code"
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!value) {
        setError('Nenhum código PIX fornecido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Configurações do QR Code
        const options = {
          width: size,
          height: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        };

        // Gerar QR Code como Data URL (base64)
        const url = await QRCode.toDataURL(value, options);
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
        setError('Erro ao gerar QR Code');
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [value, size]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E83D22]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-md ${className}`} style={{ width: size, height: size }}>
        <p className="text-xs text-gray-500 text-center p-2">{error}</p>
      </div>
    );
  }

  return (
    <img
      src={qrCodeUrl}
      alt={alt}
      className={className}
      width={size}
      height={size}
    />
  );
};

export default QRCodeGenerator;