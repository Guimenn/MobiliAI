import api from './api';

// MQTT API (para leitura de RFID)
export const mqttAPI = {
  // Aguardar leitura do RFID
  waitForRfid: async (): Promise<{ success: boolean; tag: string; timestamp: string }> => {
    const response = await api.post('/mqtt/rfid/wait');
    return response.data;
  },

  // Verificar status da conexão MQTT
  getStatus: async (): Promise<{ connected: boolean; lastTag: string | null }> => {
    const response = await api.get('/mqtt/status');
    return response.data;
  },

  // Obter última tag lida (sem aguardar)
  getLastRfid: async (): Promise<{ success: boolean; tag: string | null; timestamp: string }> => {
    const response = await api.get('/mqtt/rfid/last');
    return response.data;
  },

  // Limpar última tag RFID lida
  clearLastRfid: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/mqtt/rfid/clear');
    return response.data;
  },
};

