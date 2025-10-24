import { Helmet } from 'react-helmet';

/**
 * Componente que injeta o Meta Pixel (Facebook Pixel) diretamente no <head> da página
 * Use este componente em TODAS as páginas para rastreamento completo de 100% das vendas
 */
export const FacebookPixelHead: React.FC = () => {
  const fbPixelId1 = import.meta.env.VITE_FB_PIXEL_ID;
  const fbPixelId2 = import.meta.env.VITE_FB_PIXEL_ID_2;
  
  if (!fbPixelId1 && !fbPixelId2) {
    console.warn('[FB-PIXEL-HEAD] Nenhum Facebook Pixel ID configurado');
    return null;
  }

  return (
    <Helmet>
      {/* Meta Pixel Code */}
      <script type="text/javascript">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
${fbPixelId1 ? `fbq('init', '${fbPixelId1}');` : ''}
${fbPixelId2 ? `fbq('init', '${fbPixelId2}');` : ''}
fbq('track', 'PageView');`}
      </script>
      {/* End Meta Pixel Code */}
      
      {/* Noscript fallback para Pixel 1 */}
      {fbPixelId1 && (
        <noscript>
          {`<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${fbPixelId1}&ev=PageView&noscript=1" />`}
        </noscript>
      )}
      
      {/* Noscript fallback para Pixel 2 */}
      {fbPixelId2 && (
        <noscript>
          {`<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${fbPixelId2}&ev=PageView&noscript=1" />`}
        </noscript>
      )}
    </Helmet>
  );
};

export default FacebookPixelHead;
