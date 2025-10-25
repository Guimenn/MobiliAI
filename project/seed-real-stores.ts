import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente
config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

export async function seedRealStores() {
  console.log('🏪 Criando lojas reais de tintas...');

  // Lojas reais de tintas no Brasil
  const realStores = [
    {
      name: 'Coral Tintas - Shopping Center Norte',
      address: 'Av. Paulista, 1000 - Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      phone: '(11) 3003-3030',
      email: 'norte@coral.com.br',
      description: 'Loja especializada em tintas Coral com amplo estoque e atendimento especializado',
      workingHours: {
        monday: { open: '08:00', close: '20:00', isOpen: true },
        tuesday: { open: '08:00', close: '20:00', isOpen: true },
        wednesday: { open: '08:00', close: '20:00', isOpen: true },
        thursday: { open: '08:00', close: '20:00', isOpen: true },
        friday: { open: '08:00', close: '20:00', isOpen: true },
        saturday: { open: '08:00', close: '18:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: true }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    },
    {
      name: 'Suvinil - Vila Madalena',
      address: 'Rua Harmonia, 123 - Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05435-030',
      phone: '(11) 3030-4040',
      email: 'vilamadalena@suvinil.com.br',
      description: 'Loja Suvinil com foco em tintas premium e consultoria de cores',
      workingHours: {
        monday: { open: '08:30', close: '19:00', isOpen: true },
        tuesday: { open: '08:30', close: '19:00', isOpen: true },
        wednesday: { open: '08:30', close: '19:00', isOpen: true },
        thursday: { open: '08:30', close: '19:00', isOpen: true },
        friday: { open: '08:30', close: '19:00', isOpen: true },
        saturday: { open: '09:00', close: '17:00', isOpen: true },
        sunday: { open: '10:00', close: '15:00', isOpen: false }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: true,
        sendNotifications: true,
        autoAcceptPayments: false,
        lowStockAlert: true,
        customerRegistrationRequired: true
      }
    },
    {
      name: 'Sherwin Williams - Rio de Janeiro',
      address: 'Av. Copacabana, 500 - Copacabana',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22020-000',
      phone: '(21) 3000-5000',
      email: 'copacabana@sherwin.com.br',
      description: 'Loja Sherwin Williams com tintas profissionais e consultoria técnica',
      workingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '16:00', isOpen: true },
        sunday: { open: '09:00', close: '14:00', isOpen: false }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    },
    {
      name: 'Tintas Renner - Belo Horizonte',
      address: 'Rua da Bahia, 1200 - Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30160-012',
      phone: '(31) 3000-6000',
      email: 'centro@renner.com.br',
      description: 'Loja Renner com foco em tintas residenciais e comerciais',
      workingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '16:00', isOpen: true },
        sunday: { open: '09:00', close: '13:00', isOpen: false }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    },
    {
      name: 'Dulux - Salvador',
      address: 'Av. Tancredo Neves, 2000 - Caminho das Árvores',
      city: 'Salvador',
      state: 'BA',
      zipCode: '41820-020',
      phone: '(71) 3000-7000',
      email: 'salvador@dulux.com.br',
      description: 'Loja Dulux com tintas premium e serviços de pintura',
      workingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '16:00', isOpen: true },
        sunday: { open: '09:00', close: '14:00', isOpen: false }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    },
    {
      name: 'Tintas Iquine - Fortaleza',
      address: 'Rua Barão do Rio Branco, 800 - Centro',
      city: 'Fortaleza',
      state: 'CE',
      zipCode: '60010-150',
      phone: '(85) 3000-8000',
      email: 'fortaleza@iquine.com.br',
      description: 'Loja Iquine com tintas nacionais e importadas',
      workingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '16:00', isOpen: true },
        sunday: { open: '09:00', close: '13:00', isOpen: false }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    },
    {
      name: 'Tintas Eucatex - Brasília',
      address: 'SCS Quadra 2, Bloco A - Asa Sul',
      city: 'Brasília',
      state: 'DF',
      zipCode: '70302-000',
      phone: '(61) 3000-9000',
      email: 'brasilia@eucatex.com.br',
      description: 'Loja Eucatex com tintas e produtos para construção',
      workingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '16:00', isOpen: true },
        sunday: { open: '09:00', close: '14:00', isOpen: false }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    },
    {
      name: 'Tintas Coral - Porto Alegre',
      address: 'Av. Ipiranga, 1500 - Centro Histórico',
      city: 'Porto Alegre',
      state: 'RS',
      zipCode: '90160-093',
      phone: '(51) 3000-1000',
      email: 'portoalegre@coral.com.br',
      description: 'Loja Coral com tintas e acessórios para pintura',
      workingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '16:00', isOpen: true },
        sunday: { open: '09:00', close: '14:00', isOpen: false }
      },
      settings: {
        allowOnlineOrders: true,
        requireApprovalForOrders: false,
        sendNotifications: true,
        autoAcceptPayments: true,
        lowStockAlert: true,
        customerRegistrationRequired: false
      }
    }
  ];

  // Limpar lojas existentes (opcional - comentar se quiser manter as existentes)
  // await prisma.store.deleteMany({});

  // Criar as lojas reais
  for (const storeData of realStores) {
    try {
      const store = await prisma.store.create({
        data: {
          name: storeData.name,
          address: storeData.address,
          city: storeData.city,
          state: storeData.state,
          zipCode: storeData.zipCode,
          phone: storeData.phone,
          email: storeData.email,
          isActive: true,
          description: storeData.description,
          workingHours: storeData.workingHours,
          settings: storeData.settings
        }
      });
      
      console.log(`✅ Loja criada: ${store.name} - ${store.city}/${store.state}`);
    } catch (error) {
      console.error(`❌ Erro ao criar loja ${storeData.name}:`, error);
    }
  }

  console.log('✅ Lojas reais criadas com sucesso!');
  console.log(`📊 Total de lojas: ${realStores.length}`);
}

async function runSeedRealStores() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    console.log('🏪 Executando seed de lojas reais...');
    await seedRealStores();
    
    console.log('✅ Seed de lojas reais executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seed de lojas reais:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runSeedRealStores();
}

export { runSeedRealStores };
