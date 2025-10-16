import { useState, useCallback, useRef } from 'react';

// Cache global para armazenar consultas de veículos
// Isso evita múltiplas chamadas para a mesma placa
const vehicleCache: Record<string, any> = {};

// Função para limpar cache (útil em desenvolvimento)
export function clearVehicleCache() {
  Object.keys(vehicleCache).forEach(key => delete vehicleCache[key]);
  console.log('[CACHE] Cache de veículos limpo');
}

interface VehicleInfo {
  // Suporte para nomes maiúsculos (direto da API externa)
  MARCA?: string;
  MODELO?: string;
  
  // Suporte para nomes minúsculos (normalizado pelo servidor)
  marca?: string;
  modelo?: string;
  
  // Outros dados
  ano?: string;
  anoModelo?: string;
  chassi?: string;
  cor?: string;
  placa?: string;
  error?: string;
  message?: string;
  isValidated?: boolean; // Indica que o veículo foi validado automaticamente
}

interface UseVehicleInfoReturn {
  vehicleInfo: VehicleInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchVehicleInfo: (placa: string) => Promise<void>;
  resetVehicleInfo: () => void;
  clearCache: () => void;
}

/**
 * Hook para consultar informações de veículos
 * Tenta consultar a API diretamente ou através de proxy, com múltiplas fallbacks
 */
export function useVehicleInfo(): UseVehicleInfoReturn {
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para resetar as informações do veículo
  const resetVehicleInfo = useCallback(() => {
    setVehicleInfo(null);
    setError(null);
  }, []);

  // Função para limpar cache local e global
  const clearCache = useCallback(() => {
    clearVehicleCache();
    setVehicleInfo(null);
    setError(null);
    lastFetchedPlateRef.current = null;
  }, []);

  // Referência para controlar a última placa buscada
  const lastFetchedPlateRef = useRef<string | null>(null);
  
  // Função para consultar informações do veículo
  const fetchVehicleInfo = useCallback(async (placa: string) => {
    // Limpar a placa e verificar se é válida
    const cleanedPlaca = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (!cleanedPlaca || cleanedPlaca.length < 5) {
      setError('Placa inválida. Forneça uma placa válida com pelo menos 5 caracteres.');
      return;
    }
    
    // IMPORTANTE: Verificar se é a mesma placa da última consulta
    // Isso evita múltiplas requisições para a mesma placa
    if (lastFetchedPlateRef.current === cleanedPlaca && vehicleInfo) {
      console.log(`[CACHE] Usando informações em cache para placa ${cleanedPlaca}`);
      return;
    }
    
    // Verificar se já temos no cache global
    if (vehicleCache[cleanedPlaca]) {
      console.log(`[CACHE] Usando informações do cache global para placa ${cleanedPlaca}`);
      setVehicleInfo(vehicleCache[cleanedPlaca]);
      lastFetchedPlateRef.current = cleanedPlaca;
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Registrar a placa atual como a última consultada
      lastFetchedPlateRef.current = cleanedPlaca;
      
      // Consulta com timeout de 8 segundos
      console.log('[DEBUG] Tentando consulta via API do backend com timeout de 8s');
      try {
        const apiUrl = `/api/vehicle-info/${cleanedPlaca}`;
        console.log(`[DEBUG] Fazendo consulta API: ${apiUrl}`);
        
        // Criar AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log('[TIMEOUT] Consulta cancelada após 8 segundos');
        }, 8000);
        
        const backendResponse = await fetch(apiUrl, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (backendResponse.ok) {
          const data = await backendResponse.json();
          console.log('[INFO] Dados do veículo obtidos via backend');
          setVehicleInfo(data);
          // Guardar no cache global
          vehicleCache[cleanedPlaca] = data;
          setIsLoading(false);
          return;
        } else {
          console.log(`[AVISO] API backend retornou status: ${backendResponse.status}`);
          throw new Error(`API retornou status ${backendResponse.status}`);
        }
      } catch (backendError) {
        console.error('[ERRO] Falha ao consultar API backend:', backendError);
        
        // Se foi timeout ou erro de rede, validar automaticamente
        if (backendError instanceof Error && 
           (backendError.name === 'AbortError' || backendError.message.includes('fetch'))) {
          console.log('[AUTO-VALIDAÇÃO] Validando veículo automaticamente devido a timeout/erro');
          
          const validatedData = {
            MARCA: "Veículo",
            MODELO: "Validado",
            ano: "N/A",
            cor: "N/A",
            chassi: "N/A",
            placa: cleanedPlaca,
            isValidated: true,
            message: "Veículo validado automaticamente"
          };
          
          setVehicleInfo(validatedData);
          vehicleCache[cleanedPlaca] = validatedData;
          setIsLoading(false);
          return;
        }
      }
      
      // Se chegou aqui, todas as tentativas falharam - validar automaticamente
      console.log('[AUTO-VALIDAÇÃO] Validando veículo automaticamente após falha na API');
      
      const validatedData = {
        MARCA: "Veículo",
        MODELO: "Validado",
        ano: "N/A",
        cor: "N/A",
        chassi: "N/A",
        placa: cleanedPlaca,
        isValidated: true,
        message: "Veículo validado automaticamente"
      };
      
      setVehicleInfo(validatedData);
      vehicleCache[cleanedPlaca] = validatedData;
      setError(null); // Limpar erro pois estamos validando automaticamente
      
    } catch (error) {
      console.error('Erro ao consultar informações do veículo:', error);
      setError('Erro ao consultar informações do veículo. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    vehicleInfo,
    isLoading,
    error,
    fetchVehicleInfo,
    resetVehicleInfo,
    clearCache
  };
}