'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Shield, 
  Mail,
  Phone,
  Clock,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPage() {
  const lastUpdateDate = '15 de Janeiro de 2025';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Professional Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#3e2626] rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#3e2626] tracking-tight">
                Política de Privacidade
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Última atualização: {lastUpdateDate}
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 border-l-4 border-[#3e2626] rounded">
            <p className="text-gray-700 leading-relaxed">
              Esta Política de Privacidade descreve como a MobiliAI coleta, utiliza, armazena e protege suas informações pessoais. 
              Esta política está em conformidade com a <strong className="text-[#3e2626]">Lei Geral de Proteção de Dados (LGPD)</strong> - Lei nº 13.709/2018.
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
                Introdução
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  A MobiliAI ("nós", "nosso", "empresa" ou "nós") está comprometida em proteger a privacidade e os dados pessoais de nossos usuários. 
                  Esta Política de Privacidade estabelece como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações pessoais 
                  quando você utiliza nossos serviços, incluindo nosso website, aplicações de visualização de cores com inteligência artificial, 
                  e todas as plataformas relacionadas.
                </p>
                <p>
                  Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política. Recomendamos que leia este documento 
                  cuidadosamente para entender como tratamos suas informações pessoais. Esta política está em total conformidade com a Lei Geral 
                  de Proteção de Dados (LGPD) - Lei nº 13.709/2018.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 2 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                Informações que Coletamos
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Coletamos diferentes categorias de informações pessoais para fornecer e melhorar nossos serviços. As informações coletadas 
                  podem ser categorizadas da seguinte forma:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">2.1 Informações Fornecidas pelo Usuário</h3>
                    <p className="text-gray-700">
                      Quando você se cadastra em nossa plataforma, realiza uma compra ou utiliza nossos serviços, coletamos informações que você 
                      nos fornece diretamente, incluindo: nome completo, CPF, data de nascimento, endereço de e-mail, número de telefone, endereço 
                      postal completo, nome de usuário, senha, preferências de conta, preferências de decoração, cores favoritas, projetos salvos, 
                      fotografias de ambientes que você envia, comentários e avaliações de produtos.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">2.2 Informações Coletadas Automaticamente</h3>
                    <p className="text-gray-700">
                      Quando você acessa nosso website ou utiliza nossos serviços, coletamos automaticamente certas informações sobre seu 
                      dispositivo e comportamento de navegação. Isso inclui: páginas visitadas, tempo de permanência em cada página, cliques 
                      realizados, pesquisas realizadas, histórico de navegação, tipo de dispositivo utilizado, sistema operacional, navegador 
                      utilizado, endereço IP, identificadores únicos de dispositivo, localização geográfica aproximada (quando permitido), e 
                      informações coletadas através de cookies, pixels, web beacons e outras tecnologias de rastreamento.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">2.3 Informações de Terceiros</h3>
                    <p className="text-gray-700">
                      Podemos receber informações sobre você de terceiros, incluindo processadores de pagamento quando você realiza uma compra, 
                      serviços de análise que nos fornecem dados agregados sobre uso do site, e redes sociais quando você opta por fazer login 
                      através dessas plataformas.
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
                Como Utilizamos suas Informações
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Utilizamos suas informações pessoais para diversos propósitos relacionados à prestação de nossos serviços, melhoria de nossa 
                  plataforma e comunicação com você:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.1 Prestação de Serviços</h3>
                    <p className="text-gray-700">
                      Utilizamos suas informações para processar e gerenciar suas compras, pedidos e transações, fornecer serviços de visualização 
                      de cores com inteligência artificial, criar, salvar e gerenciar seus projetos de decoração, processar pagamentos e gerenciar 
                      faturas, e enviar atualizações sobre status de pedidos e entregas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.2 Melhoria e Desenvolvimento</h3>
                    <p className="text-gray-700">
                      Analisamos padrões de uso para melhorar nossos serviços, desenvolver novos recursos e funcionalidades, personalizar 
                      recomendações de produtos e cores com base em suas preferências, e realizar pesquisas e análises de mercado para entender 
                      melhor as necessidades de nossos usuários.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.3 Comunicação</h3>
                    <p className="text-gray-700">
                      Com seu consentimento, enviamos comunicações sobre produtos, serviços e ofertas que podem ser de seu interesse. Também 
                      utilizamos suas informações para responder a suas solicitações, dúvidas e reclamações, enviar notificações importantes sobre 
                      sua conta ou nossos serviços, e fornecer suporte ao cliente quando necessário.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">3.4 Segurança e Conformidade</h3>
                    <p className="text-gray-700">
                      Utilizamos suas informações para prevenir fraudes, atividades suspeitas e uso indevido de nossos serviços, cumprir 
                      obrigações legais, regulatórias e contratuais, resolver disputas e fazer cumprir nossos termos de uso, e proteger nossos 
                      direitos, propriedade e segurança, bem como de nossos usuários.
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
                Compartilhamento de Informações
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p className="font-semibold text-[#3e2626]">
                  Nunca vendemos suas informações pessoais.
                </p>
                
                <p>
                  Compartilhamos suas informações apenas nas seguintes circunstâncias específicas:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">4.1 Prestadores de Serviços</h3>
                    <p className="text-gray-700">
                      Podemos compartilhar suas informações com prestadores de serviços terceirizados que nos auxiliam na operação de nossos serviços, 
                      incluindo processadores de pagamento para processar transações, empresas de logística e entrega para envio de pedidos, 
                      provedores de serviços de hospedagem em nuvem para armazenamento de dados, ferramentas de análise e publicidade para melhorar 
                      nossos serviços, e serviços de e-mail e comunicação para envio de mensagens. Todos os prestadores de serviços são contratualmente 
                      obrigados a manter a confidencialidade e segurança de suas informações e a utilizar suas informações apenas para os fins 
                      especificados.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">4.2 Requisitos Legais</h3>
                    <p className="text-gray-700">
                      Podemos divulgar suas informações quando exigido por lei, ordem judicial ou processo legal, para cumprir obrigações legais 
                      ou regulatórias, para proteger nossos direitos legais, ou para prevenir atividades ilegais ou fraudulentas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">4.3 Transferências de Negócio</h3>
                    <p className="text-gray-700">
                      Em caso de fusão, aquisição, reestruturação ou venda de ativos, suas informações podem ser transferidas como parte da transação. 
                      Nesse caso, notificaremos você sobre qualquer alteração na propriedade ou uso de suas informações pessoais.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">4.4 Com seu Consentimento</h3>
                    <p className="text-gray-700">
                      Em qualquer outra situação, compartilhamos suas informações apenas com seu consentimento explícito e informado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 5 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                Segurança dos Dados
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Implementamos medidas de segurança técnicas, administrativas e físicas abrangentes para proteger suas informações pessoais contra 
                  acesso não autorizado, alteração, divulgação ou destruição.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">5.1 Medidas Técnicas</h3>
                    <p className="text-gray-700">
                      Utilizamos criptografia SSL/TLS para todas as transmissões de dados, armazenamento seguro em servidores protegidos com firewalls 
                      avançados, sistemas de detecção e prevenção de intrusão, monitoramento contínuo de segurança 24/7, e controles de acesso baseados 
                      em função para garantir que apenas pessoal autorizado tenha acesso a informações sensíveis.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">5.2 Medidas Administrativas</h3>
                    <p className="text-gray-700">
                      Mantemos acesso restrito apenas a funcionários autorizados que necessitam das informações para desempenhar suas funções, fornecemos 
                      treinamento regular em segurança de dados e privacidade, implementamos políticas rigorosas de senha e autenticação multifator, 
                      e realizamos auditorias regulares de segurança e conformidade.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">5.3 Medidas Físicas</h3>
                    <p className="text-gray-700">
                      Implementamos proteção física de servidores e equipamentos, controles de acesso físico a instalações, e medidas de segurança 
                      ambiental para proteger contra desastres naturais ou outros eventos físicos.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#3e2626]">
                    <p className="text-gray-700 text-sm">
                      <strong>Importante:</strong> Embora implementemos medidas robustas de segurança, nenhum método de transmissão pela internet ou 
                      armazenamento eletrônico é 100% seguro. Não podemos garantir segurança absoluta, mas nos comprometemos a proteger suas informações 
                      com os mais altos padrões da indústria e a notificá-lo prontamente em caso de qualquer violação de segurança que possa afetar 
                      suas informações pessoais.
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
                Seus Direitos sob a LGPD
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), você possui os seguintes direitos em relação aos seus 
                  dados pessoais:
                </p>

                <ul className="list-none space-y-3 ml-0">
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Confirmação e Acesso:</strong> Confirmar a existência de tratamento de dados pessoais e acessar seus dados pessoais, incluindo informações sobre origem, critérios utilizados e finalidade do tratamento.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Anonimização, Bloqueio ou Eliminação:</strong> Solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Portabilidade:</strong> Solicitar a portabilidade dos dados para outro fornecedor de serviço ou produto.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Eliminação:</strong> Solicitar a eliminação dos dados pessoais tratados com base em consentimento.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Informação:</strong> Obter informações sobre entidades públicas e privadas com as quais compartilhamos dados.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Revogação:</strong> Revogar seu consentimento a qualquer momento.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Oposição:</strong> Opor-se ao tratamento realizado com base em legítimo interesse.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#3e2626] font-bold mt-1">•</span>
                    <span><strong>Direito de Revisão:</strong> Solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado de dados.</span>
                  </li>
                </ul>

                <p>
                  Para exercer qualquer um desses direitos, entre em contato conosco através dos canais indicados na seção "Contato" desta política. 
                  Responderemos sua solicitação no prazo de até 15 (quinze) dias úteis, conforme exigido pela LGPD.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 7 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                Cookies e Tecnologias de Rastreamento
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do site e personalizar conteúdo. 
                  Os cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você visita nosso site.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">7.1 Tipos de Cookies</h3>
                    <p className="text-gray-700 mb-3">
                      Utilizamos os seguintes tipos de cookies:
                    </p>
                    <ul className="list-none space-y-2 ml-0">
                      <li className="flex items-start gap-3">
                        <span className="text-[#3e2626] font-bold mt-1">•</span>
                        <span><strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site e não podem ser desativados. Estes cookies são essenciais para navegação básica e funcionalidades de segurança.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#3e2626] font-bold mt-1">•</span>
                        <span><strong>Cookies de Desempenho:</strong> Coletam informações sobre como você usa o site para melhorias. Estes cookies nos ajudam a entender como os visitantes interagem com nosso site.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#3e2626] font-bold mt-1">•</span>
                        <span><strong>Cookies de Funcionalidade:</strong> Lembram suas preferências e personalizam sua experiência. Estes cookies permitem que o site se lembre de suas escolhas.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#3e2626] font-bold mt-1">•</span>
                        <span><strong>Cookies de Marketing:</strong> Usados para fornecer anúncios relevantes e medir eficácia de campanhas. Estes cookies podem ser utilizados para personalizar anúncios e rastrear eficácia de campanhas de marketing.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">7.2 Gerenciamento de Cookies</h3>
                    <p className="text-gray-700">
                      Você pode gerenciar suas preferências de cookies através das configurações do seu navegador. A maioria dos navegadores permite 
                      que você recuse ou aceite cookies, e alguns navegadores permitem que você configure seu navegador para recusar cookies de 
                      sites específicos ou de terceiros. Note que desabilitar certos cookies pode afetar a funcionalidade do site e sua experiência 
                      de uso. Para mais informações detalhadas, consulte nossa Política de Cookies.
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
                Retenção de Dados
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos nesta política, exceto quando um 
                  período de retenção mais longo é exigido ou permitido por lei.
                </p>

                <p>
                  <strong>Dados de conta ativa:</strong> Mantidos enquanto sua conta estiver ativa e por até 2 (dois) anos após inatividade, para 
                  permitir recuperação de conta e suporte contínuo.
                </p>

                <p>
                  <strong>Dados de transações:</strong> Mantidos por 5 (cinco) anos para fins fiscais e contábeis, conforme exigido por lei brasileira.
                </p>

                <p>
                  <strong>Dados de marketing:</strong> Mantidos até você revogar seu consentimento ou solicitar exclusão, após o que serão 
                  removidos imediatamente.
                </p>

                <p>
                  <strong>Logs de segurança:</strong> Mantidos por até 1 (um) ano para fins de segurança e auditoria, após o que serão excluídos 
                  ou anonimizados.
                </p>

                <p>
                  <strong>Dados analíticos:</strong> Agregados e anonimizados após o período de análise, removendo qualquer informação que possa 
                  identificar individualmente um usuário.
                </p>

                <p>
                  Após o período de retenção, excluímos ou anonimizamos seus dados de forma segura e irreversível, salvo quando a retenção for 
                  exigida por lei ou para fins legítimos de negócios, como resolução de disputas ou cumprimento de obrigações contratuais.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 9 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                Transferência Internacional de Dados
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Algumas de suas informações pessoais podem ser transferidas, processadas e armazenadas em servidores localizados fora do Brasil, 
                  especialmente quando utilizamos serviços de nuvem ou parceiros tecnológicos internacionais.
                </p>

                <p>
                  Ao transferir dados internacionalmente, garantimos que todas as transferências são realizadas em conformidade com a LGPD, 
                  implementamos salvaguardas adequadas incluindo cláusulas contratuais padrão aprovadas por autoridades de proteção de dados, 
                  os destinatários mantêm padrões de proteção de dados equivalentes aos exigidos pela LGPD, e monitoramos continuamente a 
                  conformidade de nossos parceiros internacionais.
                </p>

                <p>
                  Seus dados pessoais são protegidos com os mesmos padrões rigorosos, independentemente de onde sejam processados ou armazenados. 
                  Qualquer transferência internacional de dados é realizada apenas quando necessário para a prestação de nossos serviços e sempre 
                  em conformidade com as exigências legais aplicáveis.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 10 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">10</span>
                Privacidade de Menores
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Nossos serviços são destinados a pessoas maiores de 18 (dezoito) anos. Não coletamos intencionalmente informações pessoais de 
                  menores de idade sem o consentimento adequado dos pais ou responsáveis legais.
                </p>

                <p>
                  Se tomarmos conhecimento de que coletamos informações pessoais de um menor sem o consentimento apropriado, tomaremos medidas 
                  imediatas para excluir essas informações de nossos sistemas. Isso inclui a exclusão de dados de cadastro, conteúdo gerado pelo 
                  usuário e qualquer outra informação pessoal coletada.
                </p>

                <p>
                  Se você é pai, mãe ou responsável legal e acredita que seu filho menor de idade forneceu informações pessoais sem seu consentimento, 
                  entre em contato conosco imediatamente através dos canais indicados nesta política. Investigaremos prontamente e, se confirmado, 
                  removeremos todas as informações pessoais do menor de nossos sistemas.
                </p>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Section 11 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#3e2626] text-white rounded-lg flex items-center justify-center text-sm font-bold">11</span>
                Alterações nesta Política
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas, serviços, requisitos 
                  legais ou outras razões operacionais, legais ou regulatórias.
                </p>

                <p>
                  Notificaremos você sobre mudanças materiais nesta política através de e-mail para o endereço cadastrado em sua conta, aviso 
                  destacado em nosso website, e notificação na plataforma quando aplicável. Mudanças materiais incluem alterações significativas 
                  em como coletamos, usamos ou compartilhamos suas informações pessoais, ou alterações em seus direitos de privacidade.
                </p>

                <p>
                  A continuação do uso de nossos serviços após a publicação de alterações nesta política constitui sua aceitação das alterações. 
                  Se você não concordar com as alterações, você pode optar por encerrar sua conta e deixar de utilizar nossos serviços. Recomendamos 
                  revisar esta política periodicamente para estar ciente de quaisquer alterações.
                </p>

                <p>
                  Versões anteriores desta política estão disponíveis mediante solicitação. Entre em contato conosco se desejar receber uma cópia 
                  de uma versão anterior desta política.
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
                  <FileText className="h-6 w-6 text-[#3e2626] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-[#3e2626] mb-2">Conformidade Legal</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Esta Política de Privacidade está em total conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, 
                      Lei nº 13.709/2018, e todas as regulamentações aplicáveis. A MobiliAI está comprometida em proteger seus dados pessoais 
                      e respeitar seus direitos de privacidade. Esta política reflete nosso compromisso contínuo com a transparência, segurança e 
                      respeito pela privacidade de nossos usuários.
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
              onClick={() => window.location.href = 'mailto:privacidade@mobiliai.com.br'}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contatar DPO
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
