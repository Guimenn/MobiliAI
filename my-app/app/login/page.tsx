'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Eye, EyeOff, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCPF, formatCEP, formatPhone, formatState, formatCity, formatAddress, formatName, formatEmail } from '@/lib/input-utils';

interface ChatMessage {
  id: string;
  type: 'assistant' | 'user';
  message: string;
  timestamp: Date;
  hasSkipButton?: boolean;
  hasCepButton?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, setToken, setAuthenticated, setError } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'userInfo' | 'processing' | 'complete'>('email');
  const [credentials, setCredentials] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    phone: '', 
    cpf: '',
    address: '', 
    city: '', 
    state: '', 
    zipCode: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [currentField, setCurrentField] = useState<'name' | 'phone' | 'cpf' | 'zipCode' | 'address' | 'city' | 'state' | 'password' | 'confirmAddress'>('name');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Redirecionar usuários já logados - mais eficiente
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirecionamento imediato sem delay
      const redirectPath = user.role === 'ADMIN' || user.role === 'admin'
        ? '/admin' 
        : user.role === 'STORE_MANAGER' || user.role === 'store_manager'
        ? '/manager' 
        : user.role === 'EMPLOYEE' || user.role === 'employee' || user.role === 'CASHIER' || user.role === 'cashier'
        ? '/employee'
        : '/';
      
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    // Só inicializar conversa se não estiver logado
    if (!isAuthenticated || !user) {
    const initialMessages: ChatMessage[] = [
      {
        id: '1',
        type: 'assistant',
          message: 'Olá! 👋 Digite seu e-mail para entrar ou criar uma conta:',
        timestamp: new Date()
      }
    ];
    setMessages(initialMessages);
    }
  }, [isAuthenticated, user]);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addMessage = (type: 'assistant' | 'user', message: string, hasSkipButton = false) => {
    // Mascarar senha se for mensagem do usuário e estiver no step de password
    const displayMessage = (type === 'user' && loginStep === 'password') 
      ? '*'.repeat(message.length) 
      : message;
    
    const newMessage: ChatMessage = {
      id: generateUniqueId(),
      type,
      message: displayMessage,
      timestamp: new Date(),
      hasSkipButton
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addSkipButton = () => {
    const skipMessage: ChatMessage = {
      id: generateUniqueId(),
      type: 'assistant',
      message: '',
      timestamp: new Date(),
      hasSkipButton: true
    };
    setMessages(prev => [...prev, skipMessage]);
  };

  const addCepButton = () => {
    const cepMessage: ChatMessage = {
      id: generateUniqueId(),
      type: 'assistant',
      message: '',
      timestamp: new Date(),
      hasCepButton: true
    };
    setMessages(prev => [...prev, cepMessage]);
  };

  const simulateTyping = (message: string, delay: number = 1000, showSkipButton = false, showCepButton = false) => {
    setIsTyping(true);
    setTimeout(() => {
      addMessage('assistant', message);
      if (showSkipButton) {
        setTimeout(() => {
          addSkipButton();
        }, 500);
      }
      if (showCepButton) {
        setTimeout(() => {
          addCepButton();
        }, 500);
      }
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
        simulateTyping('❌ Por favor, digite um email válido (exemplo: usuario@email.com)', 1500);
        return;
      }

      setCredentials(prev => ({ ...prev, email: userInput }));
      
      // Verificar se o email existe
      try {
        const emailCheck = await authAPI.checkEmail(userInput);
        setEmailExists(emailCheck.exists);
        
        if (emailCheck.exists) {
          // Resetar estado de mostrar senha
          setShowPassword(false);
          setLoginStep('password');
          simulateTyping('Agora digite sua senha:', 1000);
        } else {
          setLoginStep('userInfo');
          setCurrentField('name');
          simulateTyping('📝 Parece que você não possui conta aqui. Vamos criar uma para você!', 1000);
          simulateTyping('Primeiro, me informe seu nome completo:', 1500);
        }
      } catch (error) {
        simulateTyping('❌ Erro de conexão ao verificar email. Verifique sua internet e tente novamente:', 1500);
      }
    } else if (loginStep === 'userInfo') {
      // Coletar informações do usuário
      if (currentField === 'name') {
        setCredentials(prev => ({ ...prev, name: userInput }));
        setCurrentField('phone');
        simulateTyping(`Olá ${userInput}! 👋 Agora me informe seu telefone:`, 1000, true);
      } else if (currentField === 'phone') {
        if (userInput.toLowerCase() === 'pular' || userInput.toLowerCase() === 'skip' || userInput.trim() === '') {
          setCredentials(prev => ({ ...prev, phone: '' }));
          simulateTyping('Telefone não informado. Agora me informe seu CPF:', 1000);
        } else {
          setCredentials(prev => ({ ...prev, phone: userInput }));
          simulateTyping('Agora me informe seu CPF:', 1000);
        }
        setCurrentField('cpf');
      } else if (currentField === 'cpf') {
        // Validar e formatar CPF
        const cleanCpf = userInput.replace(/\D/g, '');
        if (cleanCpf.length !== 11) {
          simulateTyping('❌ CPF deve ter 11 dígitos. Digite apenas números (exemplo: 12345678901)', 1500);
          return;
        }
        
        setCredentials(prev => ({ ...prev, cpf: cleanCpf }));
        simulateTyping('Agora me informe seu CEP:', 1000, false, true);
        setCurrentField('zipCode');
      } else if (currentField === 'zipCode') {
        // Verificar se usuário não sabe o CEP
        if (userInput.toLowerCase().includes('não sei') || userInput.toLowerCase().includes('nao sei') || userInput.toLowerCase().includes('não sei o cep') || userInput.toLowerCase().includes('nao sei o cep')) {
          simulateTyping('Sem problemas! Vamos preencher seu endereço manualmente.', 1000);
          simulateTyping('Qual é seu endereço completo:', 1000);
          setCurrentField('address');
          return;
        }
        
        // Validar formato do CEP
        const cleanCep = userInput.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
          simulateTyping('❌ CEP deve ter 8 dígitos. Digite apenas números (exemplo: 12345678) ou digite "não sei o CEP"', 1500);
          return;
        }
        
        // Buscar informações do CEP
        simulateTyping('Buscando informações do CEP...', 1000);
        
        try {
          // Integração com API ViaCEP
          const cepData = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const cepInfo = await cepData.json();
          
          if (cepInfo.erro) {
            simulateTyping('❌ CEP não encontrado em nossa base de dados.', 1500);
            simulateTyping('Vamos preencher seu endereço manualmente. Qual é seu endereço completo:', 1000);
            setCurrentField('address');
          } else {
            simulateTyping(`Encontrei o endereço para o CEP ${userInput}:`, 1000);
            simulateTyping(`📍 ${cepInfo.logradouro}, ${cepInfo.bairro}`, 1000);
            simulateTyping(`🏙️ ${cepInfo.localidade} - ${cepInfo.uf}`, 1000);
            simulateTyping('As informações estão corretas? Digite "sim" para confirmar ou "não" para corrigir:', 1000);
            
            // Armazenar dados do CEP temporariamente
            setCredentials(prev => ({ 
              ...prev, 
              zipCode: cleanCep,
              address: cepInfo.logradouro,
              city: cepInfo.localidade,
              state: cepInfo.uf
            }));
            setCurrentField('confirmAddress');
          }
        } catch (error) {
          simulateTyping('❌ Erro de conexão ao buscar CEP. Verifique sua internet e tente novamente.', 1500);
          simulateTyping('Ou digite "não sei o CEP" para preencher manualmente:', 1000);
          setCurrentField('zipCode');
        }
      } else if (currentField === 'confirmAddress') {
        if (userInput.toLowerCase() === 'sim' || userInput.toLowerCase() === 's' || userInput.toLowerCase() === 'yes') {
          simulateTyping('Perfeito! Agora crie uma senha para sua conta:', 1000);
          setCurrentField('password');
        } else if (userInput.toLowerCase() === 'não' || userInput.toLowerCase() === 'nao' || userInput.toLowerCase() === 'n' || userInput.toLowerCase() === 'no') {
          simulateTyping('Digite seu endereço completo:', 1000);
          setCurrentField('address');
        } else {
          simulateTyping('❌ Por favor, responda apenas "sim" para confirmar ou "não" para corrigir:', 1500);
        }
      } else if (currentField === 'address') {
        setCredentials(prev => ({ ...prev, address: userInput }));
        simulateTyping('Em qual cidade você mora:', 1000);
        setCurrentField('city');
      } else if (currentField === 'city') {
        setCredentials(prev => ({ ...prev, city: userInput }));
        simulateTyping('Qual estado:', 1000);
        setCurrentField('state');
      } else if (currentField === 'state') {
        setCredentials(prev => ({ ...prev, state: userInput }));
        simulateTyping('Perfeito! Agora crie uma senha para sua conta:', 1000);
        setCurrentField('password');
      } else if (currentField === 'password') {
        setCredentials(prev => ({ ...prev, password: userInput }));
        setLoginStep('processing');
        
        // Criar conta com todas as informações
        simulateTyping('Criando sua conta...', 1000);
        
        try {
          const registerData = {
            email: credentials.email,
            password: userInput,
            name: credentials.name,
            phone: credentials.phone || undefined,
            address: credentials.address || undefined,
            city: credentials.city || undefined,
            state: credentials.state || undefined,
            zipCode: credentials.zipCode || undefined,
            role: 'CUSTOMER'
          };
          
          const response = await authAPI.register(registerData);
          simulateTyping('✅ Conta criada com sucesso!', 1500);
          
          setUser(response.user);
          setToken(response.token);
          setAuthenticated(true);
          
          simulateTyping('✅ Login realizado com sucesso!', 1000);
          simulateTyping('🚀 Redirecionando...', 1500);
          setLoginStep('complete');

          // Aguardar um pouco para mostrar a mensagem e depois redirecionar
          setTimeout(() => {
            // Redirecionamento baseado no role do usuário
            const redirectPath = response.user.role === 'ADMIN' || response.user.role === 'admin'
              ? '/admin/dashboard' 
              : response.user.role === 'STORE_MANAGER' || response.user.role === 'store_manager'
              ? '/manager' 
              : response.user.role === 'EMPLOYEE' || response.user.role === 'employee' || response.user.role === 'CASHIER' || response.user.role === 'cashier'
              ? '/employee'
              : '/';
            
            router.replace(redirectPath);
          }, 4500);
        } catch (error: any) {
          let errorMessage = 'Erro inesperado ao criar conta';
          
          if (error?.response?.data?.message) {
            const backendMessage = error.response.data.message;
            if (backendMessage.includes('email')) {
              errorMessage = 'Este email já está sendo usado. Tente com outro email.';
            } else if (backendMessage.includes('CPF')) {
              errorMessage = 'Este CPF já está cadastrado. Verifique os dados e tente novamente.';
            } else {
              errorMessage = backendMessage;
            }
          } else if (error?.response?.status === 409) {
            errorMessage = 'Este email já possui uma conta. Tente fazer login ou use outro email.';
          } else if (error?.response?.status === 400) {
            errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
          }
          
          simulateTyping(`❌ ${errorMessage}`, 1500);
          simulateTyping('Vamos tentar novamente. Digite sua senha:', 1000);
          setLoginStep('userInfo');
          setCurrentField('password');
        }
      }
    } else if (loginStep === 'password') {
      // Resetar estado de mostrar senha
      setShowPassword(false);
      setCredentials(prev => ({ ...prev, password: userInput }));
      setLoginStep('processing');
      
      // Simular verificação com IA
      simulateTyping('Verificando credenciais...', 1000);
      simulateTyping('Acesso autorizado!', 2000);

      try {
        const response = await authAPI.login(credentials.email, userInput);
        simulateTyping('✅ Login realizado com sucesso!', 1000);
        
        setUser(response.user);
        setToken(response.token);
        setAuthenticated(true);
        
        simulateTyping('✅ Conta criada com sucesso!', 1000);
        simulateTyping('🚀 Redirecionando...', 1500);
        setLoginStep('complete');

        // Aguardar um pouco para mostrar a mensagem e depois redirecionar
        setTimeout(() => {
          // Redirecionamento baseado no role do usuário
          const redirectPath = response.user.role === 'ADMIN' || response.user.role === 'admin'
            ? '/admin' 
            : response.user.role === 'STORE_MANAGER' || response.user.role === 'store_manager'
            ? '/manager' 
            : response.user.role === 'EMPLOYEE' || response.user.role === 'employee' || response.user.role === 'CASHIER' || response.user.role === 'cashier'
            ? '/employee'
            : '/';
          
          router.replace(redirectPath);
        }, 4500);
      } catch (error: unknown) {
        console.error('Erro no login:', error);
        let errorMessage = 'Erro inesperado ao fazer login';
        
        if ((error as any)?.response?.data?.message) {
          const backendMessage = (error as any).response.data.message;
          if (backendMessage.includes('Email não encontrado')) {
            errorMessage = 'Este email não está cadastrado.';
          } else if (backendMessage.includes('Senha incorreta')) {
            errorMessage = 'Senha incorreta. Verifique e tente novamente.';
          } else if (backendMessage.includes('Usuário inativo')) {
            errorMessage = 'Sua conta está desativada. Entre em contato com o suporte.';
          } else {
            errorMessage = backendMessage;
          }
        } else if ((error as any)?.response?.status === 401) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if ((error as any)?.response?.status === 429) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
        }
        
        simulateTyping(`❌ ${errorMessage}`, 1500);
        simulateTyping('Digite seu email para tentar novamente:', 1000);
        setLoginStep('email');
        setCredentials({ 
          email: '', 
          password: '', 
          name: '', 
          phone: '', 
          cpf: '',
          address: '', 
          city: '', 
          state: '', 
          zipCode: '' 
        });
      }
    }

    setCurrentInput('');
  };

  // Redirecionamento imediato se usuário estiver logado
  if (isAuthenticated && user) {
    return null; // Não renderiza nada, apenas redireciona
  }

  return (
    <div className="h-screen bg-[#fafafa] flex">
         {/* Left Side - Background Image with MobiliAI Text */}
         <div className="w-1/2 relative overflow-hidden">
           {/* Background Image */}
           <div className="absolute inset-0">
             <Image
               src="/fudno.jpeg"
               alt="Background"
               fill
               className="object-cover"
               priority
             />
           </div>

           {/* Botão Voltar para Home */}
           <div className="absolute top-8 left-8 z-10">
             <Link href="/">
               <Button
                 variant="ghost"
                 className="bg-white/90 hover:bg-white text-[#3e2626] backdrop-blur-sm shadow-lg"
               >
                 <ArrowLeft className="h-4 w-4 mr-2" />
                 Voltar
               </Button>
             </Link>
           </div>
             
            {/* MobiliAI Text Overlay - Centralizado e Proporcional */}
            <div className="absolute inset-0 flex items-center justify-center pt-90 pr-10">
              <div className="text-center px-8">
               <h1 className="text-7xl font-black drop-shadow-2xl leading-tight mb-8">
                 <span className="text-[#3E2626]">Mobili</span>
                 <span className="text-white">AI</span>
             </h1>
               <div className="space-y-3">
                 <p className="text-3xl font-bold text-white drop-shadow-lg">
                   Transforme seus espaços
                 </p>
                 <p className="text-xl text-[#3e2626] font-semibold drop-shadow-md">
                   com inteligência artificial
                 </p>
               </div>
             </div>
           </div>
         </div>

        {/* Right Side - Chat Interface */}
        <div className="w-1/2 flex flex-col translate-x-[-50px] bg-[#fafafa]">
          {/* Chat Header */}
          <div className="bg-[#fafafa] p-8 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
              <Image
                src="/bot.jpeg"
                alt="AI Bot"
                width={64}
                height={64}
                className="object-cover rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">MobiliAI Assistant</h3>
              <p className="text-base text-gray-600">Assistente de Login</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-8 overflow-y-auto bg-[#fafafa]">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.hasSkipButton ? (
                    <div className="flex justify-start mb-2">
                      <button
                        onClick={() => {
                          setCurrentInput('pular');
                          handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                        }}
                        className="bg-[#3e2626] hover:bg-[#8B4513] text-white px-6 py-3 rounded-full text-sm font-medium transition-colors duration-200 shadow-lg"
                        disabled={isLoading}
                      >
                        ⏭️ Pular
                      </button>
                    </div>
                  ) : message.hasCepButton ? (
                    <div className="flex justify-start mb-2">
                      <button
                        onClick={() => {
                          setCurrentInput('não sei o CEP');
                          handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                        }}
                        className="bg-[#8B4513] hover:bg-[#3e2626] text-white px-6 py-3 rounded-full text-sm font-medium transition-colors duration-200 shadow-lg"
                        disabled={isLoading}
                      >
                        ❓ Não sei o CEP
                      </button>
                    </div>
                  ) : (
                    <div
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-sm lg:max-w-lg px-6 py-4 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-[#3e2626] text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-base leading-relaxed">{message.message}</p>
                  </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 px-6 py-4 rounded-2xl border border-gray-200 shadow-sm">
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
          <div className="p-8 bg-[#fafafa]">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                {loginStep === 'password' ? (
                  <div className="relative">
                    <Input
                      type="password"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Digite sua senha"
                      className="pr-12 h-14 border-0 bg-gray-100 focus:bg-white focus:ring-0 text-base rounded-2xl"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => {
                        const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                        if (input) {
                          if (input.type === 'password') {
                            input.type = 'text';
                          } else {
                            input.type = 'password';
                          }
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <Input
                    type={loginStep === 'email' ? 'email' : 'text'}
                    value={currentInput}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Formatação automática baseada no campo
                      if (loginStep === 'userInfo') {
                        switch (currentField) {
                          case 'cpf':
                            value = formatCPF(e.target.value);
                            break;
                          case 'zipCode':
                            value = formatCEP(e.target.value);
                            break;
                          case 'phone':
                            value = formatPhone(e.target.value);
                            break;
                          case 'state':
                            value = formatState(e.target.value);
                            break;
                          case 'city':
                            value = formatCity(e.target.value);
                            break;
                          case 'address':
                            value = formatAddress(e.target.value);
                            break;
                          case 'name':
                            value = formatName(e.target.value);
                            break;
                          default:
                            value = e.target.value;
                        }
                      } else if (loginStep === 'email') {
                        value = formatEmail(e.target.value);
                      }
                      setCurrentInput(value);
                    }}
                      placeholder={
                        loginStep === 'email' 
                          ? 'Digite seu e-mail' 
                          : loginStep === 'userInfo'
                          ? currentField === 'name' 
                            ? 'Digite seu nome completo'
                            : currentField === 'phone'
                            ? 'Digite seu telefone (ou pular)'
                            : currentField === 'cpf'
                            ? 'Digite seu CPF (ex: 123.456.789-00)'
                            : currentField === 'zipCode'
                            ? 'Digite seu CEP (ex: 12345-678) ou "não sei o CEP"'
                            : currentField === 'confirmAddress'
                            ? 'Digite "sim" ou "não"'
                            : currentField === 'address'
                            ? 'Digite seu endereço completo'
                            : currentField === 'city'
                            ? 'Digite sua cidade'
                            : currentField === 'state'
                            ? 'Digite seu estado'
                            : 'Digite sua senha'
                          : 'Digite sua mensagem'
                      }
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
              <span className="text-gray-400">
                Não tem conta? Digite seu email acima!
              </span>
            </div>
          </div>
        </div>
    </div>
  );
}
