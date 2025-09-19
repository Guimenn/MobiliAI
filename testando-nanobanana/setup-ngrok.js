import { spawn } from 'child_process';
import fs from 'node:fs';

// Script para configurar ngrok automaticamente
async function setupNgrok() {
  console.log('🔧 Configurando ngrok para URLs públicas...');
  
  // Verificar se ngrok está instalado
  try {
    const { execSync } = await import('child_process');
    execSync('ngrok version', { stdio: 'ignore' });
    console.log('✅ ngrok já está instalado');
  } catch (error) {
    console.log('📦 Instalando ngrok...');
    console.log('Execute: npm install -g ngrok');
    console.log('Ou baixe de: https://ngrok.com/download');
    return;
  }
  
  // Criar arquivo de configuração do ngrok
  const ngrokConfig = {
    version: "2",
    authtoken: "YOUR_NGROK_TOKEN_HERE", // Substitua pelo seu token
    tunnels: {
      "nanobanana": {
        proto: "http",
        addr: "3005"
      }
    }
  };
  
  fs.writeFileSync('ngrok.yml', JSON.stringify(ngrokConfig, null, 2));
  console.log('📝 Arquivo ngrok.yml criado');
  console.log('🔑 Configure seu token do ngrok no arquivo ngrok.yml');
  console.log('🚀 Execute: ngrok start nanobanana');
}

setupNgrok().catch(console.error);


