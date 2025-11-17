'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, X, HeadphonesIcon, Bot, User, Loader2, Sparkles, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface SupportChatbotProps {
  n8nWebhookUrl?: string;
}

export default function SupportChatbot({ n8nWebhookUrl }: SupportChatbotProps) {
  // URL do webhook do n8n - pode ser passada como prop ou via env
  // IMPORTANTE: A URL do webhook é FIXA, o sessionId vai no body da requisição, não na URL
  const N8N_WEBHOOK_URL = n8nWebhookUrl || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/f406671e-c954-4691-b39a-66c90aa2f103/chat';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou o assistente virtual da MobiliAI. Como posso te ajudar hoje? Posso ajudar com informações sobre produtos, entrega, pedidos e muito mais!',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Resetar contador de não lidas quando abrir
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Scroll imediato para a nova mensagem
    setTimeout(() => scrollToBottom(false), 100);

    try {
      // Chamar webhook do n8n (formato esperado pelo Chat Trigger)
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: currentInput,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status}`);
      }

      const data = await response.json();
      
      // O n8n Chat Trigger retorna a resposta em diferentes formatos possíveis
      const responseText = data.output || data.response || data.message || data.text || 'Desculpe, não consegui processar sua mensagem.';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Incrementar contador se estiver minimizado
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem para n8n:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao conectar com o atendimento. Por favor, tente novamente em alguns instantes ou entre em contato pelo telefone.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    'Prazo de entrega',
    'Como fazer pedido?',
    'Produtos em promoção',
    'Falar com humano',
  ];


  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative">
            <Button
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full bg-gradient-to-br from-[#3e2626] to-[#5e3a26] hover:from-[#5e3a26] hover:to-[#3e2626] shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white/20"
              size="lg"
              aria-label="Abrir chat de atendimento"
            >
              <HeadphonesIcon className="h-7 w-7 text-white" />
            </Button>
            {/* Badge de notificação */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {/* Efeito de brilho */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#C07A45]/20 to-transparent animate-pulse pointer-events-none" />
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 ease-out",
            isMinimized 
              ? "w-80 h-16" 
              : "w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)]"
          )}
        >
          <Card className="border-0 shadow-2xl bg-white dark:bg-gray-900 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5e3a26] text-white rounded-t-lg p-4 flex-shrink-0 relative overflow-hidden">
              {/* Efeito de brilho no header */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                      <HeadphonesIcon className="h-5 w-5 text-white" />
                    </div>
                    {/* Indicador online */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-[#3e2626] animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Atendimento MobiliAI</CardTitle>
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      Online agora
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setIsMinimized(!isMinimized)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
                    aria-label={isMinimized ? "Expandir chat" : "Minimizar chat"}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      setIsMinimized(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
                    aria-label="Fechar chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {!isMinimized && (
              <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#C07A45 transparent',
                  }}
                >
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                        message.role === 'user' ? 'justify-end' : 'justify-start',
                        index === messages.length - 1 && "animate-in fade-in slide-in-from-bottom-4"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={cn(
                          "flex items-start space-x-2 max-w-[85%]",
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        )}
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-transform hover:scale-110",
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-[#3e2626] to-[#5e3a26] text-white'
                              : 'bg-gradient-to-br from-[#C07A45] to-[#D4A574] text-white'
                          )}
                        >
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "rounded-2xl p-3.5 shadow-md transition-all hover:shadow-lg",
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-[#3e2626] to-[#5e3a26] text-white rounded-br-sm'
                              : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600'
                          )}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={cn(
                              "text-xs mt-2 flex items-center gap-1",
                              message.role === 'user'
                                ? 'text-white/70'
                                : 'text-gray-500 dark:text-gray-400'
                            )}
                          >
                            <span>
                              {message.timestamp.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-start space-x-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#C07A45] to-[#D4A574] text-white flex items-center justify-center shadow-lg">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl rounded-bl-sm p-4 border border-gray-200 dark:border-gray-600 shadow-md">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="h-2 w-2 bg-[#C07A45] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="h-2 w-2 bg-[#C07A45] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="h-2 w-2 bg-[#C07A45] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">Digitando...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length === 1 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                      Perguntas frequentes:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs hover:bg-gradient-to-r hover:from-[#3e2626] hover:to-[#5e3a26] hover:text-white hover:border-transparent transition-all hover:scale-105 active:scale-95 shadow-sm"
                          onClick={() => {
                            setInputValue(action);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
                  <div className="flex space-x-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 border-2 focus:border-[#3e2626] dark:focus:border-[#C07A45] transition-colors"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="sm"
                      className="bg-gradient-to-r from-[#3e2626] to-[#5e3a26] hover:from-[#5e3a26] hover:to-[#3e2626] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Pressione Enter para enviar • Shift+Enter para nova linha
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </>
  );
}
