'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Lightbulb,
  Palette,
  Package,
  Wrench,
  Star
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'product';
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image?: string;
  description: string;
  category: string;
}

export default function ChatbotPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mensagens de boas-vindas
  const welcomeMessages = [
    {
      id: 'welcome-1',
      text: 'Olá! Sou seu assistente virtual de tintas. Como posso ajudá-lo hoje?',
      sender: 'bot' as const,
      timestamp: new Date()
    },
    {
      id: 'welcome-2',
      text: 'Posso ajudar você com:',
      sender: 'bot' as const,
      timestamp: new Date(),
      type: 'suggestion' as const
    }
  ];

  const quickSuggestions = [
    { icon: Palette, text: 'Escolher cores para minha casa', category: 'colors' },
    { icon: Package, text: 'Ver produtos recomendados', category: 'products' },
    { icon: Wrench, text: 'Dicas de pintura', category: 'tips' },
    { icon: Lightbulb, text: 'Inspirações de decoração', category: 'inspiration' }
  ];

  const productSuggestions: ProductSuggestion[] = [
    {
      id: 'prod1',
      name: 'Tinta Acrílica Premium Branco Gelo',
      price: 89.90,
      description: 'Perfeita para salas e quartos, com excelente cobertura',
      category: 'TINTAS'
    },
    {
      id: 'prod2',
      name: 'Kit Pintura Completo Verde Menta',
      price: 299.90,
      description: 'Kit completo com tudo que você precisa para pintar',
      category: 'KITS'
    },
    {
      id: 'prod3',
      name: 'Primer Universal Branco',
      price: 45.00,
      description: 'Essencial para preparar a superfície antes da pintura',
      category: 'PRIMERS'
    }
  ];

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('loja-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
    
    // Adicionar mensagens de boas-vindas
    setMessages(welcomeMessages);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('loja-user');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const simulateBotResponse = (userMessage: string): Message => {
    const responses = {
      colors: {
        text: 'Ótima escolha! Para ajudar você a escolher as cores ideais, preciso saber:',
        suggestions: [
          'Qual ambiente você quer pintar? (sala, quarto, cozinha, etc.)',
          'Que estilo você prefere? (moderno, clássico, minimalista)',
          'A cor atual da parede'
        ]
      },
      products: {
        text: 'Aqui estão alguns produtos que recomendo para você:',
        type: 'product' as const
      },
      tips: {
        text: 'Aqui estão algumas dicas importantes para uma pintura perfeita:',
        suggestions: [
          '1. Limpe e prepare a superfície antes de pintar',
          '2. Use primer em superfícies porosas ou com cor escura',
          '3. Aplique pelo menos 2 demãos para melhor cobertura',
          '4. Deixe secar completamente entre as demãos'
        ]
      },
      inspiration: {
        text: 'Que tal essas inspirações de cores que estão em alta?',
        suggestions: [
          '🌿 Verde Menta - Tranquilidade e natureza',
          '🌊 Azul Royal - Sofisticação e elegância',
          '🌸 Rosa Pink - Alegria e modernidade',
          '☁️ Branco Gelo - Limpeza e amplitude'
        ]
      }
    };

    const lowerMessage = userMessage.toLowerCase();
    let responseType = 'default';

    if (lowerMessage.includes('cor') || lowerMessage.includes('pintar')) {
      responseType = 'colors';
    } else if (lowerMessage.includes('produto') || lowerMessage.includes('comprar')) {
      responseType = 'products';
    } else if (lowerMessage.includes('dica') || lowerMessage.includes('como')) {
      responseType = 'tips';
    } else if (lowerMessage.includes('inspiração') || lowerMessage.includes('decoração')) {
      responseType = 'inspiration';
    }

    const response = responses[responseType as keyof typeof responses] || {
      text: 'Entendi! Posso ajudar você com escolha de cores, produtos, dicas de pintura ou inspirações de decoração. O que você gostaria de saber?'
    };

    return {
      id: `bot-${Date.now()}`,
      text: response.text,
      sender: 'bot',
      timestamp: new Date(),
      type: response.type || 'text'
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simular delay da resposta do bot
    setTimeout(() => {
      const botResponse = simulateBotResponse(inputMessage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickSuggestion = (suggestion: { text: string; category: string }) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: suggestion.text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = simulateBotResponse(suggestion.category);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user}
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mr-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assistente IA</h1>
              <p className="text-gray-600">Seu consultor especializado em tintas e pintura</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-blue-600" />
                  Chat com Assistente IA
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                          message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.sender === 'user' 
                              ? 'bg-blue-600' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                        >
                          {message.sender === 'user' ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>
                        
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sugestões Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleQuickSuggestion(suggestion)}
                  >
                    <suggestion.icon className="mr-3 h-4 w-4" />
                    <span className="text-sm text-left">{suggestion.text}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Featured Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produtos em Destaque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {productSuggestions.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {product.category}
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Star className="mr-2 h-4 w-4" />
                  Dica do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <p className="text-sm text-gray-800">
                    💡 <strong>Dica:</strong> Para um acabamento perfeito, sempre aplique o primer antes da tinta final. Isso garante melhor aderência e durabilidade.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
