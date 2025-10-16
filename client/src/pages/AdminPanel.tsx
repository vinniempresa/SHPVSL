import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Send, Users, Bell, History, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PushStats {
  activeSubscriptions: number;
  totalSubscriptions: number;
  recentNotifications: number;
  lastNotifications: any[];
}

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  sentCount: number;
  successCount: number;
  failureCount: number;
  sentAt: string;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    url: '',
    icon: '/shopee-icon.jpg',
    badge: '/shopee-icon.jpg',
    tag: 'shopee-admin-notification',
    requireInteraction: false,
    data: {}
  });

  // Query para estatísticas
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<PushStats>({
    queryKey: ['/api/push-stats'],
  });

  // Query para histórico de notificações
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery<NotificationHistory[]>({
    queryKey: ['/api/notification-history'],
  });

  // Mutation para enviar notificação
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });
      if (!response.ok) {
        throw new Error('Erro ao enviar notificação');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Notificação enviada! 📢",
        description: `Enviada para ${data.stats?.total || 0} usuários. ${data.stats?.success || 0} sucessos, ${data.stats?.failure || 0} falhas.`,
      });
      // Limpar o formulário
      setNotification({
        title: '',
        body: '',
        url: '',
        icon: '/shopee-icon.jpg',
        badge: '/shopee-icon.jpg',
        tag: 'shopee-admin-notification',
        requireInteraction: false,
        data: {}
      });
      // Atualizar dados
      refetchStats();
      refetchHistory();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar notificação",
        description: error.message || "Ocorreu um erro ao enviar a notificação",
        variant: "destructive",
      });
    }
  });

  const handleSendNotification = () => {
    if (!notification.title.trim() || !notification.body.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Incluir URL no campo data da notificação
    const notificationData = {
      ...notification,
      data: {
        ...notification.data,
        url: notification.url || '/'
      }
    };

    sendNotificationMutation.mutate(notificationData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-orange-600 flex items-center justify-center gap-2">
            <Bell className="h-8 w-8" />
            Painel Administrativo
          </h1>
          <p className="text-gray-600">
            Envie notificações personalizadas para todos os usuários do app Shopee Delivery
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : stats?.activeSubscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Com notificações ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cadastrados</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statsLoading ? '...' : stats?.totalSubscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificações Enviadas</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statsLoading ? '...' : history?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de campanhas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Campanha</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {historyLoading ? '...' : history && history.length > 0 ? history[history.length - 1]?.successCount || 0 : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Sucessos na última
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Enviar Nova Notificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Nova Notificação
              </CardTitle>
              <CardDescription>
                Crie e envie uma notificação personalizada para todos os usuários ativos do app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Notificação *</Label>
                <Input
                  id="title"
                  value={notification.title}
                  onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Nova promoção disponível!"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500">{notification.title.length}/50 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Mensagem *</Label>
                <Textarea
                  id="body"
                  value={notification.body}
                  onChange={(e) => setNotification(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Digite a mensagem completa da notificação..."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">{notification.body.length}/200 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL de Redirecionamento</Label>
                <Input
                  id="url"
                  value={notification.url}
                  onChange={(e) => setNotification(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Ex: /cadastro, /treinamento, /admin (deixe vazio para página inicial)"
                />
                <p className="text-xs text-gray-500">Página para onde o usuário será redirecionado ao clicar na notificação</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tag">Tag da Notificação</Label>
                <Input
                  id="tag"
                  value={notification.tag}
                  onChange={(e) => setNotification(prev => ({ ...prev, tag: e.target.value }))}
                  placeholder="shopee-admin-notification"
                />
                <p className="text-xs text-gray-500">Usado para agrupar notificações similares</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="require-interaction"
                  checked={notification.requireInteraction}
                  onCheckedChange={(checked) => setNotification(prev => ({ ...prev, requireInteraction: checked }))}
                />
                <Label htmlFor="require-interaction">Requer interação do usuário</Label>
              </div>

              <Separator />

              <Button 
                onClick={handleSendNotification} 
                disabled={sendNotificationMutation.isPending || !notification.title.trim() || !notification.body.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                {sendNotificationMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para {stats?.activeSubscriptions || 0} usuários
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Histórico de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Notificações
              </CardTitle>
              <CardDescription>
                Últimas notificações enviadas e suas estatísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : history && history.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {history.slice().reverse().map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-600">{item.body}</p>
                          <p className="text-xs text-gray-500">{formatDate(item.sentAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          📤 {item.sentCount} enviadas
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          ✅ {item.successCount} sucessos
                        </Badge>
                        {item.failureCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            ❌ {item.failureCount} falhas
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma notificação enviada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            🔒 Painel restrito - Use com responsabilidade
          </p>
          <p>
            As notificações serão enviadas apenas para usuários que instalaram o app e concederam permissão
          </p>
        </div>
      </div>
    </div>
  );
}