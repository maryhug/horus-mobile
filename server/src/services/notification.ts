import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '../lib/prisma';
import { messaging } from '../lib/firebase';

const expo = new Expo();

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true }
    });

    if (!user?.pushToken) {
      console.log(`User ${userId} has no push token registered.`);
      return;
    }

    const pushToken = user.pushToken;

    // Detectar si es un token nativo de Firebase (FCM)
    // Los tokens de Expo suelen empezar con "ExponentPushToken[" o "ExpoPushToken["
    const isExpoToken = pushToken.startsWith('ExponentPushToken') || pushToken.startsWith('ExpoPushToken');

    if (!isExpoToken) {
      console.log(`Sending native FCM notification to user ${userId}`);
      try {
        const fcmData: Record<string, string> = {
          title,
          body,
        };

        if (data) {
          Object.keys(data).forEach(key => {
            fcmData[key] = String(data[key]);
          });
        }

        const message: any = {
          token: pushToken,
          notification: {
            title,
            body,
          },
          android: {
            priority: 'high' as const,
          },
        };

        // Si hay datos, los incluimos en el payload. 
        // Si el usuario reporta problemas, podemos sugerir desactivar 'data' temporalmente.
        if (fcmData && Object.keys(fcmData).length > 2) { // Mas de title y body
           message.data = fcmData;
        }

        const response = await messaging.send(message);
        console.log('Successfully sent native message:', response);
        return;
      } catch (error: any) {
        console.error('Error sending native FCM notification:');
        if (error.code) console.error('Error Code:', error.code);
        if (error.message) console.error('Error Message:', error.message);
        return;
      }
    }

    // Lógica para tokens de Expo
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const messages: ExpoPushMessage[] = [{
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('Push notification sent:', ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
}
