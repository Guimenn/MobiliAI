'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  HelpCircle, 
  ChevronDown,
  Search
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      category: 'Compras',
      questions: [
        {
          question: 'Como faço um pedido?',
          answer: 'Para fazer um pedido, navegue pelos produtos, adicione os itens desejados ao carrinho e finalize a compra. Você precisará criar uma conta ou fazer login para completar o pedido.'
        },
        {
          question: 'Quais formas de pagamento são aceitas?',
          answer: 'Aceitamos cartões de crédito (Visa, Mastercard, Elo, American Express), PIX, boleto bancário e parcelamento em até 12x sem juros.'
        },
        {
          question: 'Como usar cupons de desconto?',
          answer: 'No checkout, você encontrará um campo para inserir o código do cupom. Digite o código e clique em "Aplicar". O desconto será aplicado automaticamente ao total.'
        },
        {
          question: 'Posso alterar meu pedido após a confirmação?',
          answer: 'Pedidos confirmados não podem ser alterados. Se precisar fazer alterações, entre em contato conosco o mais rápido possível através do suporte.'
        }
      ]
    },
    {
      category: 'Entrega',
      questions: [
        {
          question: 'Qual o prazo de entrega?',
          answer: 'O prazo varia conforme a região e o tipo de entrega escolhido. Entrega padrão: 5 a 10 dias úteis. Entrega expressa: 2 a 5 dias úteis. Retirada na loja: disponível imediatamente após confirmação.'
        },
        {
          question: 'Como calcular o frete?',
          answer: 'O valor do frete é calculado automaticamente no checkout com base no CEP de entrega, peso e dimensões do produto. Compras acima de R$ 299,90 têm frete grátis!'
        },
        {
          question: 'Como acompanhar meu pedido?',
          answer: 'Após a confirmação do pagamento, você receberá um código de rastreamento por e-mail e SMS. Use esse código para acompanhar seu pedido em tempo real.'
        },
        {
          question: 'Posso alterar o endereço de entrega?',
          answer: 'Sim, desde que o pedido ainda não tenha sido enviado. Entre em contato com nosso suporte para solicitar a alteração do endereço.'
        }
      ]
    },
    {
      category: 'Produtos',
      questions: [
        {
          question: 'Os produtos vêm montados?',
          answer: 'A maioria dos nossos produtos requer montagem. Todos vêm com manual de instruções detalhado e ferramentas necessárias. Alguns produtos podem ser entregues montados mediante solicitação.'
        },
        {
          question: 'Como cuidar dos móveis?',
          answer: 'Cada produto possui recomendações específicas de cuidado. Consulte a página do produto ou entre em contato conosco para orientações personalizadas.'
        },
        {
          question: 'Vocês oferecem assistência para montagem?',
          answer: 'Sim, oferecemos serviço de montagem profissional em algumas regiões. Entre em contato para verificar disponibilidade e valores.'
        },
        {
          question: 'Os produtos têm garantia?',
          answer: 'Sim, todos os produtos têm garantia de 12 meses contra defeitos de fabricação. Consulte nossa página de garantia para mais detalhes.'
        }
      ]
    },
    {
      category: 'Trocas e Devoluções',
      questions: [
        {
          question: 'Qual o prazo para devolução?',
          answer: 'Você tem até 7 dias corridos, a partir da data de recebimento, para solicitar a troca ou devolução. A devolução é grátis!'
        },
        {
          question: 'Como solicitar uma devolução?',
          answer: 'Acesse "Meus Pedidos" em sua conta, selecione o produto que deseja devolver e clique em "Solicitar Devolução". Siga as instruções na tela.'
        },
        {
          question: 'Em quanto tempo recebo o reembolso?',
          answer: 'O reembolso é processado após recebermos e verificarmos o produto. PIX: até 1 dia útil. Cartão: até 2 faturas. Boleto: até 10 dias úteis.'
        },
        {
          question: 'Posso trocar por outro produto?',
          answer: 'Sim! Você pode trocar por outro modelo, tamanho ou cor. O processo é o mesmo da devolução, e após recebermos o produto original, enviaremos o novo.'
        }
      ]
    },
    {
      category: 'Conta e Cadastro',
      questions: [
        {
          question: 'Como criar uma conta?',
          answer: 'Clique em "Entrar" no canto superior direito e depois em "Criar conta". Preencha seus dados e confirme seu e-mail para ativar a conta.'
        },
        {
          question: 'Esqueci minha senha, o que fazer?',
          answer: 'Na página de login, clique em "Esqueci minha senha" e informe seu e-mail. Você receberá um link para redefinir sua senha.'
        },
        {
          question: 'Como atualizar meus dados?',
          answer: 'Acesse "Minha Conta" no menu superior e clique em "Editar Perfil". Você pode atualizar seus dados pessoais, endereço e preferências.'
        },
        {
          question: 'Posso ter mais de um endereço cadastrado?',
          answer: 'Sim, você pode cadastrar múltiplos endereços em sua conta. Isso facilita o envio para diferentes locais conforme necessário.'
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white page-with-fixed-header">
      <Header />
      
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-[#3e2626] to-[#2a1f1f] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Perguntas Frequentes
              </h1>
              <p className="text-white/80 mt-2 text-lg">
                Encontre respostas para as dúvidas mais comuns
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Busque por palavras-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-6 text-base bg-white/95 border-0 rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFAQs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-[#3e2626] mb-6">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const index = `${categoryIndex}-${questionIndex}`;
                  const isOpen = openIndex === index;
                  return (
                    <div
                      key={questionIndex}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-[#3e2626] pr-4">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Nenhuma pergunta encontrada com "{searchTerm}"
              </p>
              <p className="text-gray-500 mt-2">
                Tente buscar com outras palavras-chave
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-[#3e2626] mb-4">
            Ainda não encontrou o que procura?
          </h2>
          <p className="text-gray-600 mb-6">
            Entre em contato com nosso suporte e teremos prazer em ajudá-lo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/help"
              className="px-6 py-3 bg-[#3e2626] text-white rounded-lg hover:bg-[#2a1f1f] transition-colors font-medium"
            >
              Central de Ajuda
            </a>
            <a
              href="mailto:suporte@mobiliai.com.br"
              className="px-6 py-3 bg-white text-[#3e2626] border-2 border-[#3e2626] rounded-lg hover:bg-[#3e2626] hover:text-white transition-colors font-medium"
            >
              Enviar E-mail
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

