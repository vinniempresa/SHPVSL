// Configuração de APIs

// Determina qual é o ambiente atual
const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

// API URLs - Define as URLs da API para os ambientes de produção e desenvolvimento
export const API_URLS = {
  // Em ambos os ambientes, a API é servida pelo mesmo servidor
  development: '',
  production: ''  // Usar URL relativa pois frontend e backend estão no mesmo servidor
};

// URL base da API dependendo do ambiente
export const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : '';

// Flag para debug
const DEBUG = false;

// Utilitário para construir URLs de API
export const apiUrl = (path: string): string => {
  // Se estamos em desenvolvimento, usamos caminhos relativos
  // Se estamos em produção, usamos a URL completa da API
  const basePath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${basePath}`;
  
  // Debug removido para produção
  
  return url;
};

// Função para verificar o status da API
export const checkApiStatus = async (): Promise<{ status: string; env: string }> => {
  try {
    const healthUrl = apiUrl('/health');
    // Verificação silenciosa da API
    
    const response = await fetch(healthUrl, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`API respondeu com status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar status da API:', error);
    return { status: 'error', env: 'unknown' };
  }
};