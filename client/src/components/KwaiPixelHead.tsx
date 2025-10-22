import { Helmet } from 'react-helmet';

/**
 * Componente que injeta o Kwai Pixel diretamente no <head> da página
 * Use este componente em TODAS as páginas para rastreamento completo
 */
export const KwaiPixelHead: React.FC = () => {
  const kwaiPixelId = import.meta.env.VITE_KWAI_PIXEL_ID;
  
  if (!kwaiPixelId) {
    console.warn('[KWAI-PIXEL-HEAD] VITE_KWAI_PIXEL_ID não configurado');
    return null;
  }

  return (
    <Helmet>
      <script type="text/javascript">
        {`!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.install=t():e.install=t()}("undefined"!=typeof window?window:self,(function(){return function(e){var t={};function n(o){if(t[o])return t[o].exports;var r=t[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}return n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(o,r,function(t){return e[t]}.bind(null,r));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=72)}({72:function(e,t,n){"use strict";var o=this&&this.__spreadArray||function(e,t,n){if(n||2===arguments.length)for(var o,r=0,i=t.length;r<i;r++)!o&&r in t||(o||(o=Array.prototype.slice.call(t,0,r)),o[r]=t[r]);return e.concat(o||Array.prototype.slice.call(t))};Object.defineProperty(t,"__esModule",{value:!0});var r=function(e,t,n){var o,i=e.createElement("script");i.type="text/javascript",i.async=!0,i.src=t,n&&(i.onerror=function(){r(e,n)});var a=e.getElementsByTagName("script")[0];null===(o=a.parentNode)||void 0===o||o.insertBefore(i,a)};!function(e,t,n){e.KwaiAnalyticsObject=n;var i=e[n]=e[n]||[];i.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];var a=function(e,t){e[t]=function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];var i=o([t],n,!0);e.push(i)}};i.methods.forEach((function(e){a(i,e)})),i.instance=function(e){var t=i._i[e]||[];return i.methods.forEach((function(e){a(t,e)})),t},i.load=function(t,n){i._i=i._i||{},i._i[t]=[],i._i[t]._u="https://s1.kwai.net/kos/nlav10104/pixel/events.js",i._t=i._t||{},i._t[t]=+new Date,i._o=i._o||{},i._o[t]=n||{};var o=Math.ceil(new Date/36e5);r(e,"https://s1.kwai.net/kos/nlav10104/pixel/events.js?sdkid="+t+"&lib="+n+"&t="+o)},i.SNIPPET_VERSION="1.2"}(window,document,"kwaiq")}})}`}
      </script>
      <script type="text/javascript">
        {`kwaiq.load('${kwaiPixelId}');
kwaiq.page();`}
      </script>
    </Helmet>
  );
};

export default KwaiPixelHead;
