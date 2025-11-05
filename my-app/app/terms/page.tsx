'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  FileText, 
  Mail,
  Scale,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
  const lastUpdateDate = '15 de Janeiro de 2025';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Professional Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#3e2626] rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#3e2626] tracking-tight">
                Termos de Uso
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Última atualização: {lastUpdateDate}
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 border-l-4 border-[#3e2626] rounded">
            <p className="text-gray-700 leading-relaxed">
              Estes Termos de Uso regem o uso da plataforma MobiliAI e todos os serviços relacionados. 
              Ao acessar ou utilizar nossos serviços, você concorda em cumprir e estar vinculado a estes termos. 
              Leia cuidadosamente antes de utilizar nossos serviços.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Continuous Document */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Section 1 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Aceitação dos Termos
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Ao acessar, navegar ou utilizar o site e serviços da MobiliAI ("nós", "nosso", "empresa" ou "nós"), 
                  você concorda em cumprir e estar vinculado a estes Termos de Uso e a todas as leis e regulamentos aplicáveis. 
                  Se você não concordar com qualquer parte destes termos, você não deve utilizar nossos serviços.
                </p>
                <p>
                  Estes termos constituem um acordo legal vinculativo entre você e a MobiliAI. Ao criar uma conta ou utilizar 
                  nossos serviços, você confirma que leu, compreendeu e concorda com todos os termos e condições aqui estabelecidos.
                </p>
                <p>
                  Podemos modificar estes termos a qualquer momento. Alterações significativas serão comunicadas através de 
                  notificação em nosso site ou por e-mail. O uso continuado de nossos serviços após tais modificações constitui 
                  sua aceitação dos termos revisados.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 2 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Descrição dos Serviços
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  A MobiliAI oferece uma plataforma de e-commerce especializada em móveis e decoração, com recursos inovadores 
                  de visualização de cores e ambientes utilizando inteligência artificial. Nossos serviços incluem:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">2.1 Plataforma de E-commerce</h3>
                    <p className="text-gray-700">
                      Venda online de móveis, produtos de decoração e acessórios para casa, com catálogo virtual completo, 
                      carrinho de compras, processamento de pagamentos e gerenciamento de pedidos e entregas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">2.2 Visualização com Inteligência Artificial</h3>
                    <p className="text-gray-700">
                      Ferramentas de visualização de cores em ambientes reais utilizando tecnologia de IA, análise de imagens 
                      de ambientes enviadas pelos usuários, substituição virtual de cores e materiais, e sugestões de paletas 
                      e combinações harmoniosas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">2.3 Serviços Adicionais</h3>
                    <p className="text-gray-700">
                      Assistente virtual para auxílio na escolha de produtos e cores, sistema de favoritos e projetos salvos, 
                      recomendações personalizadas baseadas em preferências, e suporte ao cliente através de múltiplos canais.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Importante:</strong> Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto 
                      de nossos serviços a qualquer momento, com ou sem aviso prévio. Não garantimos que nossos serviços estarão 
                      sempre disponíveis, livres de erros ou funcionando perfeitamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 3 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                Conta de Usuário e Registro
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Para utilizar certos recursos de nossos serviços, você precisará criar uma conta fornecendo informações 
                  precisas, completas e atualizadas.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.1 Elegibilidade</h3>
                    <p className="text-gray-700">
                      Você deve ter pelo menos 18 (dezoito) anos de idade para criar uma conta e utilizar nossos serviços. 
                      Ao criar uma conta, você declara e garante que possui a capacidade legal para celebrar contratos vinculativos 
                      e que todas as informações fornecidas são verdadeiras, precisas e completas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.2 Responsabilidade pela Conta</h3>
                    <p className="text-gray-700">
                      Você é responsável por manter a confidencialidade de suas credenciais de login (nome de usuário e senha) 
                      e por todas as atividades que ocorrem sob sua conta. Você concorda em notificar-nos imediatamente sobre 
                      qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança. A MobiliAI não será 
                      responsável por qualquer perda ou dano decorrente de sua falha em proteger suas credenciais de conta.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.3 Informações Precisas</h3>
                    <p className="text-gray-700">
                      Você concorda em fornecer informações verdadeiras, precisas, atuais e completas durante o registro e 
                      em atualizar essas informações para mantê-las verdadeiras, precisas, atuais e completas. Informações 
                      falsas ou enganosas podem resultar no encerramento imediato de sua conta.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.4 Encerramento de Conta</h3>
                    <p className="text-gray-700">
                      Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, com ou sem aviso prévio, 
                      por violação destes termos, por comportamento fraudulento, ou por qualquer outro motivo que consideremos 
                      apropriado. Você também pode encerrar sua conta a qualquer momento entrando em contato conosco.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 4 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                Uso Aceitável
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Você concorda em utilizar nossos serviços apenas para fins legais e de acordo com estes termos. Você concorda 
                  em NÃO utilizar nossos serviços para:
                </p>

                <ul className="list-none space-y-3 ml-0">
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Qualquer atividade ilegal, fraudulenta ou não autorizada;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Violar qualquer lei, regulamento ou direito de terceiros;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Transmitir vírus, malware ou qualquer código malicioso;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Tentar acessar não autorizado a sistemas, contas ou dados de outros usuários;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Interferir ou interromper o funcionamento de nossos serviços ou servidores;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Copiar, modificar, distribuir ou criar trabalhos derivados de nosso conteúdo sem autorização;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Utilizar robôs, scripts automatizados ou métodos similares para acessar nossos serviços;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Enviar spam, mensagens não solicitadas ou conteúdo ofensivo;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Falsificar identidade ou representar falsamente afiliação com qualquer pessoa ou entidade;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Coletar ou armazenar informações pessoais de outros usuários sem consentimento.</span>
                  </li>
                </ul>

                <p>
                  Violações destas regras podem resultar em encerramento imediato de sua conta e possíveis ações legais.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 5 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                Propriedade Intelectual
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Todo o conteúdo disponível em nossos serviços, incluindo mas não limitado a textos, gráficos, logos, ícones, 
                  imagens, áudios, vídeos, software e código, é propriedade da MobiliAI ou de seus licenciadores e está protegido 
                  por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">5.1 Conteúdo da MobiliAI</h3>
                    <p className="text-gray-700">
                      Você não pode copiar, reproduzir, distribuir, modificar, criar trabalhos derivados, exibir publicamente, 
                      executar publicamente, republicar, baixar, armazenar ou transmitir qualquer conteúdo de nossos serviços sem 
                      nossa autorização prévia por escrito, exceto conforme explicitamente permitido nestes termos.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">5.2 Conteúdo do Usuário</h3>
                    <p className="text-gray-700">
                      Ao enviar, publicar ou transmitir conteúdo através de nossos serviços (incluindo imagens, comentários, 
                      avaliações e projetos), você nos concede uma licença mundial, não exclusiva, livre de royalties, perpétua 
                      e irrevogável para usar, reproduzir, modificar, adaptar, publicar, traduzir, criar trabalhos derivados, 
                      distribuir e exibir esse conteúdo em qualquer meio para fins de operação e promoção de nossos serviços.
                    </p>
                    <p className="text-gray-700 mt-2">
                      Você declara e garante que possui todos os direitos necessários sobre o conteúdo que envia e que esse 
                      conteúdo não viola direitos de terceiros.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">5.3 Marcas Registradas</h3>
                    <p className="text-gray-700">
                      "MobiliAI" e todos os nomes, logos e marcas relacionadas são marcas registradas da MobiliAI. Você não pode 
                      usar essas marcas sem nossa autorização prévia por escrito.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 6 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                Compras e Pagamentos
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Ao fazer uma compra através de nossos serviços, você concorda com os seguintes termos relacionados a compras e pagamentos:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">6.1 Preços e Produtos</h3>
                    <p className="text-gray-700">
                      Todos os preços são exibidos na moeda local (BRL) e incluem impostos aplicáveis, quando aplicável. 
                      Reservamo-nos o direito de modificar preços a qualquer momento, mas essas alterações não afetarão pedidos 
                      já confirmados. Fazemos todos os esforços para garantir que as informações dos produtos sejam precisas, 
                      mas não garantimos que todas as descrições, preços ou outras informações estejam corretas, completas ou atualizadas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">6.2 Formas de Pagamento</h3>
                    <p className="text-gray-700">
                      Aceitamos diversos métodos de pagamento, incluindo cartões de crédito, débito, PIX, boleto bancário e outras 
                      formas de pagamento disponíveis. Ao fornecer informações de pagamento, você declara e garante que possui 
                      autorização para usar o método de pagamento selecionado.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">6.3 Confirmação de Pedido</h3>
                    <p className="text-gray-700">
                      Após realizar um pedido, você receberá um e-mail de confirmação. A confirmação do pedido não constitui 
                      aceitação de sua oferta, mas apenas confirmação de recebimento. Reservamo-nos o direito de recusar ou 
                      cancelar qualquer pedido por qualquer motivo, incluindo mas não limitado a disponibilidade de produto, 
                      erro de precificação, ou suspeita de fraude.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">6.4 Entregas</h3>
                    <p className="text-gray-700">
                      Prazos de entrega são estimativas e não garantias. Não nos responsabilizamos por atrasos causados por 
                      fatores fora de nosso controle, incluindo mas não limitado a condições climáticas, desastres naturais, 
                      greves ou problemas com transportadoras. Custos de frete são calculados no momento do checkout e podem 
                      variar conforme localização e método de entrega selecionado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 7 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                Política de Devolução e Reembolso
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Nossa política de devolução e reembolso está em conformidade com o Código de Defesa do Consumidor (CDC). 
                  Você tem direito a:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">7.1 Direito de Arrependimento</h3>
                    <p className="text-gray-700">
                      Você tem o direito de desistir da compra, sem necessidade de justificativa, no prazo de 7 (sete) dias 
                      corridos a contar da data de recebimento do produto. Para exercer este direito, o produto deve estar 
                      em sua embalagem original, sem uso e sem sinais de desgaste.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">7.2 Produtos com Defeito</h3>
                    <p className="text-gray-700">
                      Produtos com defeito de fabricação ou que não correspondam à descrição terão garantia de acordo com o 
                      CDC. Você pode solicitar reparo, substituição, reembolso ou abatimento proporcional do preço, conforme 
                      aplicável.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">7.3 Processo de Devolução</h3>
                    <p className="text-gray-700">
                      Para iniciar uma devolução, entre em contato conosco através de nossos canais de atendimento. Após 
                      aprovação, forneceremos instruções para envio do produto. Custos de frete de retorno serão de responsabilidade 
                      do cliente, exceto em casos de produtos com defeito ou erro de nossa parte.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">7.4 Reembolsos</h3>
                    <p className="text-gray-700">
                      Reembolsos serão processados no mesmo método de pagamento utilizado na compra original, dentro de até 14 
                      (quatorze) dias úteis após recebimento e aprovação do produto devolvido.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 8 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                Limitação de Responsabilidade
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Na extensão máxima permitida por lei, a MobiliAI não será responsável por:
                </p>

                <ul className="list-none space-y-3 ml-0">
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou incapacidade de usar nossos serviços;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Perda de dados, lucros, receitas, oportunidades de negócios ou reputação;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Interrupções, erros, bugs ou problemas técnicos em nossos serviços;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Ações de terceiros, incluindo mas não limitado a hackers, vírus ou outros agentes maliciosos;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Conteúdo de terceiros ou links para sites externos;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Resultados de visualização de cores ou produtos que possam diferir da realidade devido a variações de monitor, iluminação ou outros fatores.</span>
                  </li>
                </ul>

                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#3e2626]">
                  <p className="text-gray-700 text-sm">
                    <strong>Importante:</strong> Nossa responsabilidade total em qualquer caso não excederá o valor total pago 
                    por você nos 12 (doze) meses anteriores ao evento que deu origem à reclamação. Algumas jurisdições não permitem 
                    a exclusão de certas garantias ou limitação de responsabilidade, portanto, algumas das limitações acima podem 
                    não se aplicar a você.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 9 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                Indenização
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Você concorda em indenizar, defender e isentar a MobiliAI, seus afiliados, diretores, funcionários, agentes e 
                  licenciadores de e contra quaisquer reclamações, demandas, perdas, responsabilidades, danos, custos e despesas 
                  (incluindo honorários advocatícios razoáveis) decorrentes de ou relacionados a:
                </p>

                <ul className="list-none space-y-3 ml-0">
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Seu uso ou mau uso de nossos serviços;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Violação destes termos ou de qualquer lei ou regulamento;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Violação de direitos de terceiros, incluindo direitos de propriedade intelectual ou privacidade;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Conteúdo que você envia, publica ou transmite através de nossos serviços.</span>
                  </li>
                </ul>

                <p>
                  Esta obrigação de indenização continuará após o término de sua utilização de nossos serviços.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 10 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">10</span>
                Lei Aplicável e Jurisdição
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Estes Termos de Uso são regidos e interpretados de acordo com as leis da República Federativa do Brasil, 
                  sem considerar conflitos de disposições legais.
                </p>
                <p>
                  Qualquer disputa decorrente ou relacionada a estes termos ou a nossos serviços será resolvida primeiramente 
                  através de negociação de boa-fé. Se não pudermos resolver a disputa através de negociação, você concorda em 
                  submeter-se à jurisdição exclusiva dos tribunais competentes de São Paulo, SP, Brasil, renunciando a qualquer 
                  objeção a tal jurisdição ou foro.
                </p>
                <p>
                  Você também reconhece que, em caso de violação destes termos, a MobiliAI poderá buscar medidas cautelares ou 
                  injunções em qualquer jurisdição apropriada.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 11 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">11</span>
                Disposições Gerais
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">11.1 Integridade do Acordo</h3>
                    <p className="text-gray-700">
                      Estes termos, juntamente com nossa Política de Privacidade e Política de Cookies, constituem o acordo 
                      completo entre você e a MobiliAI em relação ao uso de nossos serviços e substituem todos os acordos 
                      anteriores ou contemporâneos.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">11.2 Divisibilidade</h3>
                    <p className="text-gray-700">
                      Se qualquer disposição destes termos for considerada inválida, ilegal ou inaplicável por um tribunal 
                      competente, a validade e aplicabilidade das demais disposições permanecerão em pleno vigor.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">11.3 Renúncia</h3>
                    <p className="text-gray-700">
                      A falha da MobiliAI em exercer ou fazer valer qualquer direito ou disposição destes termos não constituirá 
                      uma renúncia a tal direito ou disposição. Nenhuma renúncia será efetiva a menos que seja feita por escrito 
                      e assinada por um representante autorizado da MobiliAI.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">11.4 Cessão</h3>
                    <p className="text-gray-700">
                      Você não pode transferir ou ceder seus direitos ou obrigações sob estes termos sem nosso consentimento prévio 
                      por escrito. A MobiliAI pode transferir ou ceder estes termos ou qualquer direito ou obrigação aqui estabelecido 
                      sem sua aprovação prévia.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">11.5 Força Maior</h3>
                    <p className="text-gray-700">
                      Não seremos responsáveis por qualquer falha ou atraso no desempenho resultante de causas além de nosso controle 
                      razoável, incluindo mas não limitado a desastres naturais, guerra, terrorismo, greves, falhas de energia ou 
                      internet, ou atos de governos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 12 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">12</span>
                Alterações nos Termos
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento, a nosso exclusivo critério. Alterações 
                  significativas serão comunicadas através de:
                </p>

                <ul className="list-none space-y-3 ml-0">
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Notificação em destaque em nosso website;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>E-mail para o endereço cadastrado em sua conta;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span>Notificação na plataforma quando aplicável.</span>
                  </li>
                </ul>

                <p>
                  O uso continuado de nossos serviços após a publicação de alterações constitui sua aceitação dos termos revisados. 
                  Se você não concordar com as alterações, você pode optar por encerrar sua conta e deixar de utilizar nossos serviços. 
                  Recomendamos revisar estes termos periodicamente.
                </p>

                <p className="font-semibold text-[#3e2626]">
                  Data da última atualização: {lastUpdateDate}
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Legal Compliance */}
            <div className="mt-16 pt-8 border-t-2 border-gray-300">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-start gap-4">
                  <Scale className="h-6 w-6 text-[#3e2626] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">Conformidade Legal</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Estes Termos de Uso estão em conformidade com o <strong>Código de Defesa do Consumidor (CDC)</strong>, 
                      Lei nº 8.078/1990, a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, Lei nº 13.709/2018, e todas 
                      as leis e regulamentos aplicáveis no Brasil. A MobiliAI está comprometida em operar em total conformidade 
                      com a legislação brasileira e respeitar os direitos de todos os usuários.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-[#3e2626] hover:bg-[#2a1f1f] text-white px-8 py-6 rounded-lg font-medium"
              onClick={() => window.location.href = 'mailto:legal@mobiliai.com.br'}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contatar Jurídico
            </Button>
            <Button
              variant="outline"
              className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-8 py-6 rounded-lg font-medium"
              onClick={() => window.location.href = '/contact'}
            >
              Página de Contato
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
