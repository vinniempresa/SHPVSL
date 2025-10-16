import { useEffect } from 'react';
import { useVehicleInfo } from '@/hooks/use-vehicle-info';
import { Loader2, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleInfoBoxProps {
  licensePlate: string | undefined;
  onChange?: (hasValidVehicle: boolean) => void;
  className?: string;
}

/**
 * Componente que exibe informações de veículo a partir da placa
 */
export function VehicleInfoBox({ licensePlate, onChange, className = '' }: VehicleInfoBoxProps) {
  // Hook para buscar informações do veículo
  const { vehicleInfo, isLoading, error, fetchVehicleInfo, clearCache } = useVehicleInfo();

  // Buscar informações do veículo quando a placa mudar
  useEffect(() => {
    console.log(`[VehicleInfoBox] licensePlate recebida: "${licensePlate}", length: ${licensePlate?.length || 0}`);
    
    // Aumentar o debounce para reduzir chamadas durante digitação
    const timer = setTimeout(() => {
      if (licensePlate && licensePlate.length >= 7) {
        // Comparar com a última placa limpa para evitar requisições duplicadas
        const cleanedPlate = licensePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        console.log(`[VehicleInfoBox] Buscando informações: ${cleanedPlate}`);
        fetchVehicleInfo(licensePlate);
      } else {
        console.log(`[VehicleInfoBox] Placa muito curta (${licensePlate?.length || 0} caracteres), aguardando mais caracteres...`);
      }
    }, 800); // Debounce aumentado para evitar requisições excessivas

    return () => clearTimeout(timer);
  }, [licensePlate, fetchVehicleInfo]);

  // Notificar componente pai sobre a validade do veículo
  useEffect(() => {
    if (onChange) {
      // Veículo é válido se temos dados e não há erro, OU se foi validado automaticamente
      const isValid = (!!vehicleInfo && !vehicleInfo.error && !error) || 
                     (!!vehicleInfo && vehicleInfo.isValidated);
      onChange(isValid);
    }
  }, [vehicleInfo, error, onChange]);

  // Se não tem placa ou é muito curta, mostra mensagem solicitando
  if (!licensePlate || licensePlate.length < 5) {
    return (
      <div className={`p-4 border rounded-md bg-gray-50 text-gray-500 ${className}`}>
        Insira a placa do veículo para consultar informações
      </div>
    );
  }

  // Se está carregando, mostra indicador
  if (isLoading) {
    return (
      <div className={`p-4 border rounded-md bg-gray-50 flex items-center justify-center ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span>Consultando informações...</span>
      </div>
    );
  }

  // Se tem erro, mostra mensagem
  if (error || (vehicleInfo && vehicleInfo.error)) {
    return (
      <div className={`p-4 border rounded-md bg-red-50 text-red-700 ${className}`}>
        {error || vehicleInfo?.error || 'Erro ao consultar veículo'}
      </div>
    );
  }

  // Se tem dados, mostra informações do veículo
  if (vehicleInfo) {
    // Detectar se são dados de teste
    const isTestData = vehicleInfo.marca?.includes('Teste') || 
                       vehicleInfo.MARCA?.includes('TESTE') ||
                       vehicleInfo.chassi?.includes('TESTE') ||
                       vehicleInfo.message?.includes('teste');
    
    // Verificar se foi validado automaticamente
    const isAutoValidated = vehicleInfo.isValidated;
    
    return (
      <div className={`p-4 border rounded-md ${
        isAutoValidated ? 'bg-green-50 border-green-200' :
        isTestData ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
      } ${className}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {isAutoValidated && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            <h3 className="font-medium text-gray-800">
              {isAutoValidated ? "Veículo Validado" : "Informações do Veículo"}
            </h3>
          </div>
          {isTestData && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                clearCache();
                if (licensePlate) fetchVehicleInfo(licensePlate);
              }}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Recarregar
            </Button>
          )}
        </div>
        
        {isTestData && (
          <div className="mb-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
            ⚠️ Dados de teste - Clique em "Recarregar" para tentar obter dados reais
          </div>
        )}
        
        {isAutoValidated && (
          <div className="mb-2 text-xs text-green-700 bg-green-100 p-2 rounded flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Veículo validado automaticamente. Você pode continuar com o cadastro.
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-600">Marca:</span>
            <span className="ml-1 text-gray-800">{vehicleInfo.MARCA || vehicleInfo.marca || "Não informado"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Modelo:</span>
            <span className="ml-1 text-gray-800">{vehicleInfo.MODELO || vehicleInfo.modelo || "Não informado"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Ano Modelo:</span>
            <span className="ml-1 text-gray-800">{vehicleInfo.anoModelo || vehicleInfo.ano || "Não informado"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Ano Fabricação:</span>
            <span className="ml-1 text-gray-800">{vehicleInfo.anoFabricacao || vehicleInfo.ano || "Não informado"}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Cor:</span>
            <span className="ml-1 text-gray-800">{vehicleInfo.cor || "Não informado"}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-600">Chassi:</span>
            <span className="ml-1 text-gray-800">{vehicleInfo.chassi || "Não informado"}</span>
          </div>
        </div>
      </div>
    );
  }

  // Estado vazio (placa inserida mas ainda não consultou)
  return (
    <div className={`p-4 border rounded-md bg-gray-50 text-gray-500 ${className}`}>
      Aguardando consulta de informações do veículo...
    </div>
  );
}