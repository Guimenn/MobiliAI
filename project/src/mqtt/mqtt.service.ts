import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;
  private messageListeners: Map<string, Set<(message: string) => void>> = new Map();
  private lastRfidTag: string | null = null;
  private lastRfidTagTimestamp: number | null = null;
  private rfidListeners: Set<(tag: string) => void> = new Set();
  private waitStartTime: number | null = null; // Timestamp de quando começou a aguardar

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const broker = this.configService.get<string>('MQTT_BROKER', '10.84.6.135');
    const port = this.configService.get<number>('MQTT_PORT', 1883);
    const clientId = this.configService.get<string>('MQTT_CLIENT_ID', 'NestJS_Backend');

    const brokerUrl = `mqtt://${broker}:${port}`;
    
    this.logger.log(`Conectando ao broker MQTT: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      keepalive: 60,
      clean: true,
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Conectado ao broker MQTT');
      
      // Inscrever no tópico RFID
      const rfidTopic = this.configService.get<string>('MQTT_TOPIC_RFID', 'palmieri/tag');
      this.client?.subscribe(rfidTopic, (err) => {
        if (err) {
          this.logger.error(`Erro ao se inscrever no tópico ${rfidTopic}:`, err);
        } else {
          this.logger.log(`📡 Inscrito no tópico: ${rfidTopic}`);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      const messageStr = message.toString();
      this.logger.debug(`Mensagem recebida do tópico ${topic}: ${messageStr}`);

      // Notificar listeners específicos do tópico
      const listeners = this.messageListeners.get(topic);
      if (listeners) {
        listeners.forEach(listener => listener(messageStr));
      }

      // Se for o tópico RFID, atualizar última tag e notificar listeners
      const rfidTopic = this.configService.get<string>('MQTT_TOPIC_RFID', 'palmieri/tag');
      if (topic === rfidTopic) {
        const now = Date.now();
        const previousTag = this.lastRfidTag;
        this.lastRfidTag = messageStr;
        this.lastRfidTagTimestamp = now;
        
        // Só notificar listeners se for uma tag diferente ou se estiver aguardando
        if (messageStr !== previousTag || this.waitStartTime !== null) {
          this.logger.debug(`Tag RFID recebida: ${messageStr} em ${new Date(now).toISOString()} (aguardando: ${this.waitStartTime !== null})`);
          this.rfidListeners.forEach(listener => listener(messageStr));
        } else {
          this.logger.debug(`Tag RFID repetida ignorada: ${messageStr} (não está aguardando)`);
        }
      }
    });

    this.client.on('error', (error) => {
      this.logger.error('Erro MQTT:', error);
    });

    this.client.on('close', () => {
      this.logger.warn('Conexão MQTT fechada');
    });

    this.client.on('reconnect', () => {
      this.logger.log('Reconectando ao MQTT...');
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      this.logger.log('Desconectando do broker MQTT...');
      this.client.end();
      this.client = null;
    }
  }

  /**
   * Aguarda uma mensagem do tópico RFID com timeout
   * Só aceita tags recebidas DEPOIS que começou a aguardar
   */
  async waitForRfidTag(timeout: number = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error('Cliente MQTT não está conectado'));
        return;
      }

      // Limpar tag antiga antes de começar a aguardar
      this.lastRfidTag = null;
      this.lastRfidTagTimestamp = null;
      
      // Marcar o momento em que começou a aguardar
      const waitStartTime = Date.now();
      this.waitStartTime = waitStartTime;
      
      this.logger.log(`Aguardando nova leitura de RFID (timeout: ${timeout}ms)`);

      const timeoutId = setTimeout(() => {
        this.rfidListeners.delete(handler);
        this.waitStartTime = null;
        reject(new Error(`Timeout aguardando leitura do RFID (${timeout}ms)`));
      }, timeout);

      const handler = (tag: string) => {
        // Verificar se a tag foi recebida DEPOIS que começou a aguardar
        const tagTimestamp = this.lastRfidTagTimestamp;
        const now = Date.now();
        
        // Verificar se o timestamp da tag é válido e foi recebido DEPOIS do waitStartTime
        // Adicionar margem de segurança de 50ms para evitar problemas de timing
        if (!tagTimestamp || tagTimestamp < (waitStartTime - 50)) {
          // Tag antiga, ignorar e continuar aguardando
          this.logger.debug(`Tag RFID antiga ignorada: ${tag} (timestamp: ${tagTimestamp}, waitStart: ${waitStartTime}, diff: ${tagTimestamp ? tagTimestamp - waitStartTime : 'N/A'}ms)`);
          return;
        }

        // Tag nova recebida após começar a aguardar
        clearTimeout(timeoutId);
        this.rfidListeners.delete(handler);
        this.waitStartTime = null;
        this.logger.log(`✅ Tag RFID nova recebida: ${tag} (${now - tagTimestamp}ms após recebimento)`);
        resolve(tag);
      };

      this.rfidListeners.add(handler);
    });
  }

  /**
   * Obtém a última tag RFID lida
   */
  getLastRfidTag(): string | null {
    return this.lastRfidTag;
  }

  /**
   * Verifica se o cliente está conectado
   */
  isConnected(): boolean {
    return this.client?.connected === true;
  }

  /**
   * Limpa a última tag RFID lida
   */
  clearLastRfidTag(): void {
    this.lastRfidTag = null;
    this.lastRfidTagTimestamp = null;
    this.waitStartTime = null;
    this.logger.log('Última tag RFID limpa');
  }
}

