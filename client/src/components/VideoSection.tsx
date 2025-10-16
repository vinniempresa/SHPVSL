import React, { useEffect } from 'react';

const VideoSection: React.FC = () => {
  useEffect(() => {
    // Carregamento correto do script do vídeo - usando o código fornecido pelo usuário
    const existingScript = document.querySelector('script[src*="converteai.net"]');
    if (!existingScript) {
      const s = document.createElement("script");
      s.src = "https://scripts.converteai.net/7f004cb4-ff4b-48f5-8be2-7f09adfd539d/players/68daaf50aac00b46e24fb98c/v4/player.js";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <section className="bg-white py-4">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-semibold mb-4 text-center text-[#555]">Assista o vídeo abaixo para entender como funcionam as entregas na Shopee:</h2>
        
        {/* Vídeo Embed - Elemento correto */}
        <div className="mb-6 max-w-4xl mx-auto">
          <div 
            dangerouslySetInnerHTML={{
              __html: '<vturb-smartplayer id="vid-68daaf50aac00b46e24fb98c" style="display: block; margin: 0 auto; width: 100%;"></vturb-smartplayer>'
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default VideoSection;