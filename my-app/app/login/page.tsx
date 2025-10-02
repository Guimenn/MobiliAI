'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  type: 'assistant' | 'user';
  message: string;
  timestamp: Date;
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, setAuthenticated, setError } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'processing' | 'complete'>('email');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Inicializar conversa
    const initialMessages: ChatMessage[] = [
      {
        id: '1',
        type: 'assistant',
        message: 'Olá! 👋 Para continuar, me informe seu e-mail:',
        timestamp: new Date()
      }
    ];
    setMessages(initialMessages);
  }, []);

  const addMessage = (type: 'assistant' | 'user', message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = (message: string, delay: number = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      addMessage('assistant', message);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInput.trim()) return;

    const userInput = currentInput.trim();
    addMessage('user', userInput);

    if (loginStep === 'email') {
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInput)) {
        simulateTyping('Este não parece ser um e-mail válido. Tente novamente:', 1500);
        return;
      }

      setCredentials(prev => ({ ...prev, email: userInput }));
      setLoginStep('password');
      simulateTyping('Agora me informe sua senha:', 800);
    } else if (loginStep === 'password') {
      setCredentials(prev => ({ ...prev, password: userInput }));
      setLoginStep('processing');
      
      // Simular verificação com IA
      simulateTyping('Verificando credenciais...', 1000);
      simulateTyping('Acesso autorizado!', 2000);

      try {
        const response = await authAPI.login(credentials.email, userInput);
        
        setUser(response.user);
        setToken(response.token);
        setAuthenticated(true);
        
        simulateTyping('✅ Redirecionando...', 3000);
        setLoginStep('complete');

        setTimeout(() => {
          if (response.user.role === 'admin') {
            window.location.replace('/admin/dashboard');
          } else if (response.user.role === 'store_manager') {
            window.location.replace('/manager');
          } else {
            window.location.replace('/');
          }
        }, 4000);
      } catch (error: unknown) {
        console.error('Erro no login:', error);
        const errorMessage = (error as any)?.response?.data?.message || 'Erro ao fazer login';
        simulateTyping(`❌ ${errorMessage}. Tente novamente:`, 1500);
        setLoginStep('email');
        setCredentials({ email: '', password: '' });
      }
    }

    setCurrentInput('');
  };

  return (
    <div className="h-screen bg-white flex">
         {/* Left Side - Logo and Branding */}
         <div className="w-1/2 relative flex flex-col items-center justify-center p-16 overflow-hidden">
           {/* Background Image */}
           <div className="absolute inset-0">
             <Image
               src="/image.png"
               alt="Background"
               fill
               className="object-cover"
               priority
             />
             {/* Overlay for better text readability */}
             <div className="absolute inset-0 bg-[#3e2626]/40" />
           </div>

           <div className="text-center max-w-lg relative z-10">
             {/* Logo */}
             <div className="mb-12">
               <Image
                 src="/logo.png"
                 alt="MobiliAI Logo"
                 width={300}
                 height={300}
                 className="mx-auto"
                 priority
               />
             </div>
             
             {/* Brand Name */}
             <h1 className="text-5xl font-bold text-white mb-6">
               MobiliAI
             </h1>
             
             {/* Subtitle */}
             <p className="text-gray-300 text-xl mb-8">
               Sistema Inteligente de Decoração
             </p>
             
             {/* Description */}
             <p className="text-gray-400 text-lg leading-relaxed">
               Transforme sua casa com móveis e decorações usando nossa IA Decoradora. 
               Visualize móveis no seu ambiente real antes de comprar.
             </p>
           </div>
         </div>

        {/* Right Side - Chat Interface */}
        <div className="w-1/2 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-8 flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#3e2626] rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">MobiliAI Assistant</h3>
              <p className="text-base text-gray-600">Assistente de Login</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-sm lg:max-w-lg px-6 py-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-[#3e2626] text-white'
                        : 'bg-white text-gray-800 shadow-sm border'
                    }`}
                  >
                    <p className="text-base">{message.message}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 shadow-sm border px-6 py-4 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-8 bg-white">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                {loginStep === 'password' ? (
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Digite sua senha"
                      className="pr-12 h-14 border-0 bg-gray-100 focus:bg-white focus:ring-0 text-base rounded-2xl"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                ) : (
                  <Input
                    type="email"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder={loginStep === 'email' ? 'Digite seu e-mail' : 'Digite sua mensagem'}
                    className="h-14 border-0 bg-gray-100 focus:bg-white focus:ring-0 text-base rounded-2xl"
                    disabled={isLoading}
                  />
                )}
              </div>
              <Button
                type="submit"
                className="h-14 w-14 bg-[#3e2626] hover:bg-[#3e2626]/90 text-white rounded-2xl shadow-lg"
                disabled={isLoading || !currentInput.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-8 flex justify-center space-x-8 text-base">
              <Link href="#" className="text-[#3e2626] hover:underline font-medium">
                Esqueci minha senha
              </Link>
              <Link href="/register" className="text-[#3e2626] hover:underline font-medium">
                Criar conta gratuita
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}
