'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Eye, EyeOff, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCPF, formatCEP, formatPhone, formatState, formatCity, formatAddress, formatName, formatEmail } from '@/lib/input-utils';
import { auth as firebaseAuth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

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
  const searchParams = useSearchParams();
  const { user, isAuthenticated, setUser, setToken, setAuthenticated, setError } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'userInfo' | 'processing' | 'complete' | 'forgotPassword' | 'resetCode' | 'resetPassword'>('email');
  const redirectPath = searchParams.get('redirect') || null;
  const messageParam = searchParams.get('message') || null;
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
  const [resetData, setResetData] = useState({
    email: '',
    code: '',
    newPassword: ''
  });
  const [currentResetCode, setCurrentResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [currentField, setCurrentField] = useState<'name' | 'phone' | 'cpf' | 'zipCode' | 'address' | 'city' | 'state' | 'password' | 'confirmAddress'>('name');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
      // Se há um redirectPath nos parâmetros, usar ele, senão redirecionar baseado no role
      const finalRedirectPath = redirectPath || (
        user.role === 'ADMIN' || user.role === 'admin'
          ? '/admin' 
          : user.role === 'STORE_MANAGER' || user.role === 'store_manager'
          ? '/manager' 
          : user.role === 'EMPLOYEE' || user.role === 'employee' || user.role === 'CASHIER' || user.role === 'cashier'
          ? '/employee'
          : '/'
      );
      
      router.replace(finalRedirectPath);
    }
  }, [isAuthenticated, user, router, redirectPath]);

  useEffect(() => {
    // Só inicializar conversa se não estiver logado
    if (!isAuthenticated || !user) {
      const maintenanceMode = searchParams.get('maintenance');
      let initialMessage = messageParam 
        ? messageParam 
        : 'Olá! 👋 Digite seu e-mail para entrar ou criar uma conta:';
      
      // Se veio redirecionado por modo de manutenção, mostrar mensagem especial
      if (maintenanceMode === 'true') {
        initialMessage = '⚠️ O sistema está em modo de manutenção.\n\nApenas administradores podem fazer login no momento.\n\nTente novamente mais tarde ou entre em contato com o suporte.';
      }
      
      const initialMessages: ChatMessage[] = [
        {
          id: '1',
          type: 'assistant',
          message: initialMessage,
          timestamp: new Date()
        }
      ];
      setMessages(initialMessages);
    }
  }, [isAuthenticated, user, messageParam, searchParams]);

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

  const handleGoogleLogin = async () => {
    if (!firebaseAuth) {
      console.error('Firebase Auth não está disponível');
      simulateTyping('❌ Erro: Firebase não está configurado. Verifique as variáveis de ambiente.', 1500);
      return;
    }

    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      // Adicionar mensagem no chat
      addMessage('user', `Login com Google: ${user.email}`);
      simulateTyping('🔐 Autenticando com Google...', 1000);

      // Obter o token do Firebase e enviar para o backend
      const idToken = await user.getIdToken();
      
      try {
        // Enviar token para o backend validar e fazer login/registro
        const response = await authAPI.loginWithGoogle(idToken);
        
        // Salvar dados do usuário e token
        setUser(response.user);
        setToken(response.token);
        setAuthenticated(true);
        
        simulateTyping('✅ Login com Google realizado com sucesso!', 1000);
        simulateTyping('🚀 Redirecionando...', 1500);
        setLoginStep('complete');

        // Aguardar um pouco para mostrar a mensagem e depois redirecionar
        setTimeout(() => {
          // Redirecionamento baseado no role do usuário ou redirectPath
          const finalRedirectPath = redirectPath || (
            response.user.role === 'ADMIN' || response.user.role === 'admin'
              ? '/admin/dashboard' 
              : response.user.role === 'STORE_MANAGER' || response.user.role === 'store_manager'
              ? '/manager' 
              : response.user.role === 'EMPLOYEE' || response.user.role === 'employee' || response.user.role === 'CASHIER' || response.user.role === 'cashier'
              ? '/employee'
              : '/'
          );
          
          router.replace(finalRedirectPath);
        }, 2500);
      } catch (error: any) {
        console.error('Erro ao fazer login com Google no backend:', error);
        let errorMessage = 'Erro ao autenticar com Google';
        
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.response?.status === 401) {
          errorMessage = 'Não foi possível autenticar com Google. Tente novamente.';
        }
        
        simulateTyping(`❌ ${errorMessage}`, 2000);
      }
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado. Tente novamente.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup bloqueado. Permita popups para este site.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }
      
      simulateTyping(`❌ ${errorMessage}`, 2000);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInput.trim()) return;

    const userInput = currentInput.trim();
    
    // Resetar showPassword e limpar input IMEDIATAMENTE ao enviar
    // Isso garante que a senha não apareça no input após o envio
    if (loginStep === 'password' || loginStep === 'resetPassword') {
      setShowPassword(false);
    }
    setCurrentInput('');
    
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
            cpf: credentials.cpf || undefined,
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
            // Redirecionamento baseado no role do usuário ou redirectPath
            const finalRedirectPath = redirectPath || (
              response.user.role === 'ADMIN' || response.user.role === 'admin'
                ? '/admin/dashboard' 
                : response.user.role === 'STORE_MANAGER' || response.user.role === 'store_manager'
                ? '/manager' 
                : response.user.role === 'EMPLOYEE' || response.user.role === 'employee' || response.user.role === 'CASHIER' || response.user.role === 'cashier'
                ? '/employee'
                : '/'
            );
            
            router.replace(finalRedirectPath);
          }, 4500);
        } catch (error: any) {
          let errorMessage = 'Erro inesperado ao criar conta';
          
          if (error?.response?.data?.message) {
            const backendMessage = error.response.data.message;
            // Traduzir mensagens técnicas para mensagens mais amigáveis
            if (backendMessage.toLowerCase().includes('unauthorized') || backendMessage === 'Unauthorized') {
              errorMessage = 'Não foi possível criar sua conta. Verifique os dados e tente novamente.';
            } else if (backendMessage.includes('email')) {
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
          } else if (error?.response?.status === 401) {
            errorMessage = 'Não foi possível criar sua conta. Verifique os dados e tente novamente.';
          }
          
          simulateTyping(`❌ ${errorMessage}`, 1500);
          simulateTyping('Vamos tentar novamente. Digite sua senha:', 1000);
          setLoginStep('userInfo');
          setCurrentField('password');
        }
      }
    } else if (loginStep === 'forgotPassword') {
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInput)) {
        simulateTyping('❌ Por favor, digite um email válido (exemplo: usuario@email.com)', 1500);
        return;
      }

      setResetData(prev => ({ ...prev, email: userInput }));
      setLoginStep('processing');

      try {
        simulateTyping('Enviando código de recuperação...', 1000);
        const response = await authAPI.forgotPassword(userInput);
        
        // Verificar se o email existe no banco
        if (response.emailExists) {
          simulateTyping('✅ Código enviado! Verifique seu email e digite o código de 6 dígitos que você recebeu:', 2000);
          setLoginStep('resetCode');
        } else {
          // Email não existe no banco
          simulateTyping(`❌ ${response.message}`, 2000);
          simulateTyping('Digite um email válido cadastrado no sistema:', 1500);
          setLoginStep('forgotPassword');
        }
      } catch (error: any) {
        let errorMessage = error?.response?.data?.message || 'Erro ao enviar código. Tente novamente.';
        // Traduzir mensagens técnicas para mensagens mais amigáveis
        if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage === 'Unauthorized') {
          errorMessage = 'Não foi possível enviar o código. Verifique seu email e tente novamente.';
        }
        simulateTyping(`❌ ${errorMessage}`, 1500);
        simulateTyping('Digite seu email novamente:', 1000);
        setLoginStep('forgotPassword');
      }
    } else if (loginStep === 'resetCode') {
      // Validar código (6 dígitos)
      const cleanCode = userInput.replace(/\D/g, '');
      if (cleanCode.length !== 6) {
        simulateTyping('❌ O código deve ter 6 dígitos. Digite apenas números:', 1500);
        return;
      }

      setResetData(prev => ({ ...prev, code: cleanCode }));
      setCurrentResetCode(cleanCode);
      setLoginStep('processing');

      // Validar o código com o backend ANTES de pedir a nova senha
      try {
        simulateTyping('Verificando código...', 1000);
        await authAPI.verifyResetCode(resetData.email, cleanCode);
        simulateTyping('✅ Código válido! Agora crie uma nova senha:', 1500);
        setShowPassword(false);
        setLoginStep('resetPassword');
      } catch (error: any) {
        let errorMessage = 'Erro ao verificar código';
        if (error?.response?.data?.message) {
          const backendMessage = error.response.data.message;
          // Traduzir mensagens técnicas para mensagens mais amigáveis
          if (backendMessage.toLowerCase().includes('unauthorized') || backendMessage === 'Unauthorized') {
            errorMessage = 'Código inválido ou expirado. Verifique o código e tente novamente.';
          } else {
            errorMessage = backendMessage;
          }
        }
        simulateTyping(`❌ ${errorMessage}`, 1500);
        simulateTyping('Digite o código novamente:', 1000);
        setLoginStep('resetCode');
        setResetData(prev => ({ ...prev, code: '' }));
        setCurrentResetCode('');
      }
    } else if (loginStep === 'resetPassword') {
      if (userInput.length < 6) {
        simulateTyping('❌ A senha deve ter pelo menos 6 caracteres:', 1500);
        return;
      }

      setResetData(prev => ({ ...prev, newPassword: userInput }));
      setLoginStep('processing');

      try {
        simulateTyping('Redefinindo senha...', 1000);
        // Usar currentResetCode para garantir que temos o código correto
        const codeToUse = currentResetCode || resetData.code;
        await authAPI.resetPassword(resetData.email, codeToUse, userInput);
        simulateTyping('✅ Senha redefinida com sucesso!', 1500);
        simulateTyping('Agora você pode fazer login com sua nova senha. Digite seu email:', 2000);
        setLoginStep('email');
        setResetData({ email: '', code: '', newPassword: '' });
        setCurrentResetCode('');
      } catch (error: any) {
        let errorMessage = 'Erro ao redefinir senha';
        if (error?.response?.data?.message) {
          const backendMessage = error.response.data.message;
          // Traduzir mensagens técnicas para mensagens mais amigáveis
          if (backendMessage.toLowerCase().includes('unauthorized') || backendMessage === 'Unauthorized') {
            errorMessage = 'Não foi possível redefinir a senha. Verifique o código e tente novamente.';
          } else {
            errorMessage = backendMessage;
          }
        }
        simulateTyping(`❌ ${errorMessage}`, 1500);
        
        if (errorMessage.includes('Código')) {
          simulateTyping('Digite o código novamente:', 1000);
          setLoginStep('resetCode');
          setResetData(prev => ({ ...prev, code: '' }));
          setCurrentResetCode('');
        } else {
          simulateTyping('Digite sua nova senha:', 1000);
          setShowPassword(false);
          setLoginStep('resetPassword');
        }
      }
    } else if (loginStep === 'password') {
      setCredentials(prev => ({ ...prev, password: userInput }));
      setLoginStep('processing');
      
      // Verificar modo de manutenção ANTES de fazer login
      try {
        simulateTyping('Verificando sistema...', 800);
        const maintenanceCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/public/maintenance-mode`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (maintenanceCheck.ok) {
          const maintenanceData = await maintenanceCheck.json();
          if (maintenanceData?.maintenanceMode === true) {
            // Verificar se é admin antes de bloquear
            // Tentar fazer login primeiro para verificar se é admin
            try {
              const response = await authAPI.login(credentials.email, userInput);
              // Se chegou aqui, é admin (backend permitiu)
              setUser(response.user);
              setToken(response.token);
              setAuthenticated(true);
              simulateTyping('✅ Login realizado com sucesso!', 1000);
              simulateTyping('🚀 Redirecionando...', 1500);
              setLoginStep('complete');
              
              setTimeout(() => {
                router.replace('/admin');
              }, 2500);
              return;
            } catch (loginError: any) {
              // Se não conseguiu fazer login, verificar se é erro de manutenção
              const errorMsg = loginError?.response?.data?.message || '';
              if (errorMsg.includes('manutenção') || errorMsg.includes('manutenção')) {
                simulateTyping('⚠️ O sistema está em modo de manutenção.', 1500);
                simulateTyping('Apenas administradores podem fazer login no momento.', 1500);
                simulateTyping('Tente novamente mais tarde ou entre em contato com o suporte.', 2000);
                setLoginStep('email');
                return;
              }
              // Se não for erro de manutenção, continuar com o tratamento normal de erro
              throw loginError;
            }
          }
        }
      } catch (maintenanceError) {
        console.error('Erro ao verificar modo de manutenção:', maintenanceError);
        // Continuar com login normal se não conseguir verificar
      }
      
      // Mostrar que está verificando
      simulateTyping('Verificando credenciais...', 1000);

      try {
        const response = await authAPI.login(credentials.email, userInput);
        
        setUser(response.user);
        setToken(response.token);
        setAuthenticated(true);
        
        simulateTyping('✅ Login realizado com sucesso!', 1000);
        simulateTyping('🚀 Redirecionando...', 1500);
        setLoginStep('complete');

        // Aguardar um pouco para mostrar a mensagem e depois redirecionar
        setTimeout(() => {
          // Redirecionamento baseado no role do usuário
          const finalRedirectPath = redirectPath || (
            response.user.role === 'ADMIN' || response.user.role === 'admin'
              ? '/admin' 
              : response.user.role === 'STORE_MANAGER' || response.user.role === 'store_manager'
              ? '/manager' 
              : response.user.role === 'EMPLOYEE' || response.user.role === 'employee' || response.user.role === 'CASHIER' || response.user.role === 'cashier'
              ? '/employee'
              : '/'
          );
          
          router.replace(finalRedirectPath);
        }, 2500);
      } catch (error: unknown) {
        console.error('Erro no login:', error);
        
        // Determinar o tipo de erro e mostrar mensagem apropriada
        let errorMessage = '';
        let needsEmailReset = false;
        
        if ((error as any)?.response?.data?.message) {
          const backendMessage = (error as any).response.data.message;
          // Traduzir mensagens técnicas para mensagens mais amigáveis
          if (backendMessage.toLowerCase().includes('unauthorized') || backendMessage === 'Unauthorized') {
            errorMessage = '❌ Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
            needsEmailReset = true;
          } else if (backendMessage.includes('Email não encontrado')) {
            errorMessage = '❌ Este email não está cadastrado em nosso sistema.';
            needsEmailReset = true;
          } else if (backendMessage.includes('Senha incorreta') || backendMessage.toLowerCase().includes('senha')) {
            errorMessage = '❌ A senha informada está incorreta. Por favor, verifique e tente novamente.';
            needsEmailReset = true;
          } else if (backendMessage.includes('Usuário inativo')) {
            errorMessage = '❌ Sua conta está desativada. Entre em contato com o suporte para reativar.';
            needsEmailReset = true;
          } else if (backendMessage.includes('manutenção') || backendMessage.toLowerCase().includes('maintenance')) {
            errorMessage = '⚠️ O sistema está em modo de manutenção. Apenas administradores podem fazer login no momento. Tente novamente mais tarde.';
            needsEmailReset = true;
          } else {
            errorMessage = `❌ ${backendMessage}`;
            needsEmailReset = true;
          }
        } else if ((error as any)?.response?.status === 401) {
          // Erro genérico 401 - pode ser email ou senha
          errorMessage = '❌ Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
          needsEmailReset = true;
        } else if ((error as any)?.response?.status === 429) {
          errorMessage = '⚠️ Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.';
          needsEmailReset = true;
        } else {
          errorMessage = '❌ Ocorreu um erro ao fazer login. Verifique sua conexão e tente novamente.';
          needsEmailReset = true;
        }
        
        // Mostrar mensagem de erro
        simulateTyping(errorMessage, 2000);
        
        // Se precisar resetar, voltar para o passo do email
        if (needsEmailReset) {
          setTimeout(() => {
            simulateTyping('🔐 Por favor, digite seu email novamente para tentar fazer login:', 1500);
            setLoginStep('email');
            setShowPassword(false);
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
          }, 2500);
        }
      }
    }
  };

  // Redirecionamento imediato se usuário estiver logado
  if (isAuthenticated && user) {
    return null; // Não renderiza nada, apenas redireciona
  }

  return (
    <div className="h-screen flex relative overflow-hidden">
         {/* Background Image - Covering entire page - Hidden on small screens */}
         <div className="absolute inset-0 z-0 hidden md:block">
           <Image
             src="/fundo-login.png"
             alt="Background"
             fill
             className=""
             priority
             quality={100}
             unoptimized={false}
           />
         </div>

         {/* Botão Voltar para Home - Visible only on large screens */}
         <div className="absolute top-8 left-8 z-20 hidden md:block">
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

         {/* Left Side - Background Image with MobiliAI Text - Hidden on small screens */}
         <div className="w-full relative z-10 hidden md:block">
             
            {/* MobiliAI Text Overlay - Centralizado e Proporcional */}
            <div className="absolute inset-0 flex items-center justify-center pr-50">
              <div className="text-center px-8">
               {/* Logo da Loja */}
               <div className="mb-6 flex justify-center">
                 <Image
                   src="/logotipos/7.svg"
                   alt="Logo da Loja"
                   width={800}
                   height={500}
                   className="drop-shadow-2xl"
                   priority
                 />
               </div>
               
               <div className="space-y-3">
                 <p className="text-3xl font-bold text-[#3e2626] drop-shadow-lg">
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
        <div className="w-full md:w-2/3 flex flex-col md:translate-x-[-50px] relative z-10 bg-white md:bg-transparent">
          {/* Botão Voltar para Home - Inside chat area - Only on small screens */}
          <div className="pt-4 px-4 block md:hidden">
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

          {/* Chat Header */}
          <div className="px-4 pb-4 pt-2 md:p-8 flex items-center space-x-4">
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
          <div className="flex-1 px-4 py-2 md:p-8 overflow-y-auto">
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
          <div className="px-4 pb-4 md:p-8">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                {loginStep === 'password' || loginStep === 'resetPassword' ? (
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder={loginStep === 'password' ? 'Digite sua senha' : 'Digite sua nova senha'}
                      className="pr-12 h-14 border-0 bg-gray-100 focus:bg-white focus:ring-0 text-base rounded-2xl"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
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
                      } else if (loginStep === 'email' || loginStep === 'forgotPassword') {
                        value = formatEmail(e.target.value);
                      } else if (loginStep === 'resetCode') {
                        // Apenas números, máximo 6 dígitos
                        value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      }
                      setCurrentInput(value);
                    }}
                      placeholder={
                        (() => {
                          if (loginStep === 'email') return 'Digite seu e-mail';
                          if (loginStep === 'forgotPassword') return 'Digite seu email para recuperação';
                          if (loginStep === 'resetCode') return 'Digite o código de 6 dígitos';
                          if (loginStep === 'userInfo') {
                            if (currentField === 'name') return 'Digite seu nome completo';
                            if (currentField === 'phone') return 'Digite seu telefone (ou pular)';
                            if (currentField === 'cpf') return 'Digite seu CPF (ex: 123.456.789-00)';
                            if (currentField === 'zipCode') return 'Digite seu CEP (ex: 12345-678) ou "não sei o CEP"';
                            if (currentField === 'confirmAddress') return 'Digite "sim" ou "não"';
                            if (currentField === 'address') return 'Digite seu endereço completo';
                            if (currentField === 'city') return 'Digite sua cidade';
                            if (currentField === 'state') return 'Digite seu estado';
                            return 'Digite sua senha';
                          }
                          return 'Digite sua mensagem';
                        })()
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

            {/* Botão de Login com Google - Mostrar apenas no step inicial */}
            {loginStep === 'email' && messages.length === 1 && !isTyping && (
              <div className="mt-6">
                <div className="flex items-center w-full mb-4">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">ou</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full h-10 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-[#3e2626] rounded-2xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-3"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continuar com Google</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Links */}
            <div className="mt-8 flex justify-center space-x-8 text-base">
              <button
                onClick={() => {
                  if (loginStep === 'email' || loginStep === 'password') {
                    setLoginStep('forgotPassword');
                    setMessages([{
                      id: generateUniqueId(),
                      type: 'assistant',
                      message: 'Esqueceu sua senha? 😊 Digite seu email para receber um código de recuperação:',
                      timestamp: new Date()
                    }]);
                    setCurrentInput('');
                  }
                }}
                className="text-[#3e2626] hover:underline font-medium cursor-pointer"
                disabled={loginStep === 'processing' || loginStep === 'complete' || loginStep === 'forgotPassword' || loginStep === 'resetCode' || loginStep === 'resetPassword'}
              >
                Esqueci minha senha
              </button>
              <span className="text-gray-400">
                Não tem conta? Digite seu email acima!
              </span>
            </div>
          </div>
        </div>
    </div>
  );
}
