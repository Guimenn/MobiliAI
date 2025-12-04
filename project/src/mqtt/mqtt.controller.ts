import { Controller, Post, Get, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mqtt')
@UseGuards(JwtAuthGuard)
export class MqttController {
  constructor(private readonly mqttService: MqttService) {}

  /**
   * Endpoint para aguardar leitura do RFID
   * O frontend faz polling ou aguarda a resposta
   */
  @Post('rfid/wait')
  async waitForRfid(@Req() req: any) {
    try {
      if (!this.mqttService.isConnected()) {
        throw new HttpException(
          'Serviço MQTT não está conectado',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      // Limpar tag ANTES de começar a aguardar (garantir que não use tag antiga)
      this.mqttService.clearLastRfidTag();
      
      // Pequeno delay para garantir que a limpeza foi processada
      await new Promise(resolve => setTimeout(resolve, 100));

      // Aguardar leitura do RFID (timeout de 30 segundos)
      const tag = await this.mqttService.waitForRfidTag(30000);
      
      return {
        success: true,
        tag,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erro ao aguardar leitura do RFID',
        HttpStatus.REQUEST_TIMEOUT
      );
    }
  }

  /**
   * Endpoint para verificar status da conexão MQTT
   */
  @Get('status')
  getStatus() {
    return {
      connected: this.mqttService.isConnected(),
      lastTag: this.mqttService.getLastRfidTag(),
    };
  }

  /**
   * Endpoint para obter a última tag lida (sem aguardar)
   */
  @Get('rfid/last')
  getLastRfid() {
    const tag = this.mqttService.getLastRfidTag();
    return {
      success: tag !== null,
      tag,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Endpoint para limpar a última tag RFID lida
   */
  @Post('rfid/clear')
  clearLastRfid() {
    this.mqttService.clearLastRfidTag();
    return {
      success: true,
      message: 'Tag RFID limpa com sucesso',
    };
  }
}

