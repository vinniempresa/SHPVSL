import type { Express } from "express";
import webpush from "web-push";
import { storage } from "./storage";
import { pushSubscriptions, notificationHistory, insertPushSubscriptionSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

// Configurar VAPID keys para web push
webpush.setVapidDetails(
  'mailto:admin@shopeedelivery.com',
  'BBAAnkFyzcnnfWoQ9DqjiY9QkQSFvScy9P_yi5LstVHcu01ja4rkYi_4ax50cZ24TTa_4aebogbVLur0NSEWHNo',
  'BtF5d4hPQAGaz0nFV7n9hjwD1VTYOqKQW2R6nivWpKk'
);

// Sistema de notificações automáticas a cada 30 minutos
let notificationInterval: NodeJS.Timeout | null = null;

const sendTrainingReminderToAll = async () => {
  try {
    console.log('🔔 Enviando lembrete de treinamento para todos os usuários...');
    
    // Buscar todas as subscriptions ativas
    const subscriptions = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));
    
    if (subscriptions.length === 0) {
      console.log('❌ Nenhuma subscription ativa encontrada');
      return;
    }
    
    // Preparar payload da notificação urgente
    const payload = JSON.stringify({
      title: '⏰ ÚLTIMA CHANCE: Sua Vaga Expira!',
      body: 'Você ainda não completou o treinamento! Sua vaga será cancelada se não agir agora.',
      icon: '/shopee-icon.jpg',
      badge: '/shopee-icon.jpg',
      tag: 'shopee-training-reminder',
      data: { action: 'open_training', urgent: true },
      requireInteraction: true,
      silent: false
    });
    
    console.log(`📢 Enviando lembrete urgente para ${subscriptions.length} usuários`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Enviar para cada subscription
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dhKey!,
            auth: subscription.authKey!
          }
        }, payload);
        
        successCount++;
        console.log(`✅ Lembrete enviado para: ${subscription.endpoint.substring(0, 50)}...`);
      } catch (error: any) {
        failureCount++;
        console.error(`❌ Erro ao enviar lembrete para ${subscription.endpoint.substring(0, 50)}...`, error.message);
        
        // Se a subscription é inválida, desativá-la
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.update(pushSubscriptions)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(pushSubscriptions.id, subscription.id));
          console.log(`🗑️ Subscription desativada (inválida): ${subscription.id}`);
        }
      }
    });
    
    await Promise.all(promises);
    
    // Salvar histórico da notificação
    await db.insert(notificationHistory).values({
      title: '⏰ ÚLTIMA CHANCE: Sua Vaga Expira!',
      body: 'Você ainda não completou o treinamento! Sua vaga será cancelada se não agir agora.',
      icon: '/shopee-icon.jpg',
      badge: '/shopee-icon.jpg',
      tag: 'shopee-training-reminder',
      data: { action: 'open_training', urgent: true },
      sentCount: subscriptions.length,
      successCount,
      failureCount,
      sentAt: new Date()
    });
    
    console.log(`📊 Resultado do lembrete: ${successCount} sucessos, ${failureCount} falhas`);
  } catch (error) {
    console.error('❌ Erro ao enviar lembrete automático:', error);
  }
};

const startTrainingReminderSystem = () => {
  // Limpar intervalo anterior se existir
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  
  console.log('🚀 Iniciando sistema de lembretes de treinamento (a cada 30 minutos)');
  
  // Configurar intervalo de 30 minutos (1800000 ms)
  notificationInterval = setInterval(sendTrainingReminderToAll, 30 * 60 * 1000);
  
  // Enviar primeira notificação após 2 minutos (para teste)
  setTimeout(sendTrainingReminderToAll, 2 * 60 * 1000);
};

const stopTrainingReminderSystem = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('🛑 Sistema de lembretes de treinamento parado');
  }
};

export function setupPushNotifications(app: Express) {
  
  // Iniciar sistema de lembretes automáticos
  startTrainingReminderSystem();
  
  // Salvar subscription de push notification
  app.post('/api/push-subscriptions', async (req: any, res) => {
    try {
      const validation = insertPushSubscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: validation.error });
      }

      const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
      
      const data = {
        ...validation.data,
        ipAddress: clientIp.toString(),
        userAgent: req.headers['user-agent'] || '',
      };

      // Verificar se já existe uma subscription para este endpoint
      const existingSubscription = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, data.endpoint))
        .limit(1);

      if (existingSubscription.length > 0) {
        // Atualizar subscription existente
        await db.update(pushSubscriptions)
          .set({ 
            ...data, 
            isActive: true,
            updatedAt: new Date() 
          })
          .where(eq(pushSubscriptions.endpoint, data.endpoint));
        
        console.log('🔄 Push subscription atualizada:', data.endpoint);
      } else {
        // Criar nova subscription
        await db.insert(pushSubscriptions).values(data);
        console.log('✅ Nova push subscription criada:', data.endpoint);
        
        // Enviar notificação de boas-vindas incentivando o treinamento
        try {
          const payload = JSON.stringify({
            title: '🎓 Finalize seu Cadastro!',
            body: 'Complete o treinamento obrigatório para entregadores e comece a trabalhar conosco.',
            icon: '/shopee-icon.jpg',
            badge: '/shopee-icon.jpg',
            tag: 'shopee-training-welcome',
            data: { action: 'open_training' },
            requireInteraction: true
          });

          await webpush.sendNotification({
            endpoint: data.endpoint,
            keys: {
              p256dh: data.p256dhKey!,
              auth: data.authKey!
            }
          }, payload);
          
          console.log('✅ Notificação de treinamento enviada para novo usuário');
        } catch (error) {
          console.error('❌ Erro ao enviar notificação de boas-vindas:', error);
        }
      }

      res.json({ success: true, message: 'Subscription salva com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao salvar push subscription:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Listar todas as subscriptions ativas
  app.get('/api/push-subscriptions', async (req: any, res) => {
    try {
      const subscriptions = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));
      
      res.json(subscriptions);
    } catch (error) {
      console.error('❌ Erro ao buscar subscriptions:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Enviar notification para todos os usuários
  app.post('/api/send-notification', async (req: any, res) => {
    try {
      const { title, body, icon, badge, tag, data: notificationData, requireInteraction } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: 'Título e corpo são obrigatórios' });
      }
      
      // Buscar todas as subscriptions ativas
      const subscriptions = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));
      
      if (subscriptions.length === 0) {
        return res.status(400).json({ error: 'Nenhuma subscription ativa encontrada' });
      }
      
      // Preparar payload da notificação
      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/shopee-icon.jpg',
        badge: badge || '/shopee-icon.jpg',
        tag: tag || 'shopee-admin-notification',
        data: notificationData || {},
        requireInteraction: requireInteraction || false
      });
      
      console.log(`📢 Enviando notificação para ${subscriptions.length} usuários:`, payload);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Enviar para cada subscription
      const promises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey!,
              auth: subscription.authKey!
            }
          }, payload);
          
          successCount++;
          console.log(`✅ Notificação enviada com sucesso para: ${subscription.endpoint.substring(0, 50)}...`);
        } catch (error: any) {
          failureCount++;
          console.error(`❌ Erro ao enviar para ${subscription.endpoint.substring(0, 50)}...`, error.message);
          
          // Se a subscription é inválida, desativá-la
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.update(pushSubscriptions)
              .set({ isActive: false, updatedAt: new Date() })
              .where(eq(pushSubscriptions.id, subscription.id));
            console.log(`🗑️ Subscription desativada (inválida): ${subscription.id}`);
          }
        }
      });
      
      await Promise.all(promises);
      
      // Salvar histórico da notificação
      await db.insert(notificationHistory).values({
        title,
        body,
        icon: icon || '/shopee-icon.jpg',
        badge: badge || '/shopee-icon.jpg',
        tag: tag || 'shopee-admin-notification',
        data: notificationData || {},
        sentCount: subscriptions.length,
        successCount,
        failureCount,
        sentAt: new Date()
      });
      
      console.log(`📊 Resultado do envio: ${successCount} sucessos, ${failureCount} falhas`);
      
      res.json({
        success: true,
        message: 'Notificação enviada',
        stats: {
          total: subscriptions.length,
          success: successCount,
          failure: failureCount
        }
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Listar histórico de notificações
  app.get('/api/notification-history', async (req: any, res) => {
    try {
      const history = await db.select()
        .from(notificationHistory);
      
      res.json(history);
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Estatísticas de push notifications
  app.get('/api/push-stats', async (req: any, res) => {
    try {
      const activeSubscriptions = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));
      
      const totalSubscriptions = await db.select()
        .from(pushSubscriptions);
      
      const recentNotifications = await db.select()
        .from(notificationHistory)
        .limit(5);
      
      res.json({
        activeSubscriptions: activeSubscriptions.length,
        totalSubscriptions: totalSubscriptions.length,
        recentNotifications: recentNotifications.length,
        lastNotifications: recentNotifications
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}