'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { env } from '@/lib/env';

interface UseMQTTOptions {
  topic: string;
  onMessage?: (message: string) => void;
  enabled?: boolean;
}

export function useMQTT({ topic, onMessage, enabled = true }: UseMQTTOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const clientRef = useRef<MqttClient | null>(null);
  const onMessageRef = useRef(onMessage);

  // Atualizar referência do callback
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Criar conexão MQTT usando WebSocket (ws://) para funcionar no navegador
    const brokerUrl = `ws://${env.MQTT_BROKER}:${env.MQTT_WS_PORT}`;
    
    console.log('Conectando ao MQTT broker:', brokerUrl);
    console.log('Configuração MQTT:', {
      broker: env.MQTT_BROKER,
      port: env.MQTT_WS_PORT,
      topic: topic,
      enabled: enabled
    });
    
    const client = mqtt.connect(brokerUrl, {
      clientId: `mqtt_${Math.random().toString(16).substring(2, 10)}`,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      keepalive: 60,
      clean: true,
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log('MQTT conectado!');
      setIsConnected(true);
      
      // Inscrever no tópico
      client.subscribe(topic, (err: Error | null) => {
        if (err) {
          console.error('Erro ao se inscrever no tópico:', err);
        } else {
          console.log(`Inscrito no tópico: ${topic}`);
        }
      });
    });

    client.on('message', (receivedTopic: string, message: Buffer) => {
      if (receivedTopic === topic) {
        const messageStr = message.toString();
        console.log('Mensagem recebida do RFID:', messageStr);
        setLastMessage(messageStr);
        
        // Chamar callback se fornecido
        if (onMessageRef.current) {
          onMessageRef.current(messageStr);
        }
      }
    });

    client.on('error', (error: Error) => {
      console.error('Erro MQTT:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        broker: brokerUrl
      });
      setIsConnected(false);
    });
    
    client.on('offline', () => {
      console.log('Cliente MQTT offline');
      setIsConnected(false);
    });

    client.on('close', () => {
      console.log('Conexão MQTT fechada');
      setIsConnected(false);
    });

    client.on('reconnect', () => {
      console.log('Reconectando ao MQTT...');
    });

    // Cleanup
    return () => {
      if (clientRef.current) {
        console.log('Desconectando MQTT...');
        clientRef.current.end();
        clientRef.current = null;
      }
    };
  }, [topic, enabled]);

  const waitForMessage = useCallback((timeout: number = 30000): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!clientRef.current) {
        reject(new Error('Cliente MQTT não inicializado'));
        return;
      }

      // Função para verificar se o cliente está realmente conectado
      const checkClientConnected = () => {
        return clientRef.current && clientRef.current.connected === true;
      };

      // Se não estiver conectado, aguardar conexão
      if (!checkClientConnected()) {
        console.log('Aguardando conexão MQTT no waitForMessage...');
        let attempts = 0;
        const maxAttempts = 30; // 15 segundos
        
        const checkConnection = setInterval(() => {
          attempts++;
          
          if (checkClientConnected()) {
            clearInterval(checkConnection);
            console.log('Cliente MQTT conectado, configurando listener...');
            setupMessageListener();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkConnection);
            reject(new Error(`MQTT não está conectado. Verifique a conexão com o broker em ${env.MQTT_BROKER}:${env.MQTT_WS_PORT}. Certifique-se de que o broker MQTT tem WebSocket habilitado.`));
          }
        }, 500);
        return;
      }

      setupMessageListener();

      function setupMessageListener() {
        const timeoutId = setTimeout(() => {
          if (clientRef.current) {
            clientRef.current.removeListener('message', messageHandler);
          }
          reject(new Error('Timeout aguardando leitura do RFID (30 segundos)'));
        }, timeout);

        const messageHandler = (receivedTopic: string, message: Buffer) => {
          if (receivedTopic === topic) {
            clearTimeout(timeoutId);
            if (clientRef.current) {
              clientRef.current.removeListener('message', messageHandler);
            }
            resolve(message.toString());
          }
        };

        if (clientRef.current) {
          clientRef.current.on('message', messageHandler);
        }
      }
    });
  }, [topic]);

  return {
    isConnected,
    lastMessage,
    waitForMessage,
  };
}

