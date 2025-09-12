import { config } from 'dotenv';
import { seedDatabase } from './src/database/seed';

// Carregar variáveis de ambiente
config();

async function runSeed() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    console.log('🌱 Executando seed...');
    await seedDatabase();
    
    console.log('✅ Seed executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
  } finally {
    process.exit(0);
  }
}

runSeed();
