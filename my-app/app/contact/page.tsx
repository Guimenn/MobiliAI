'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Building2,
  User,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simular envio (aqui você pode integrar com EmailJS, backend, etc.)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aqui você pode adicionar a integração real:
      // - EmailJS: emailjs.send(...)
      // - Backend API: api.post('/contact', formData)
      // - Serviço de email: sendEmail(formData)
      
      setIsSubmitted(true);
      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      
      // Resetar formulário
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

      // Resetar estado após 5 segundos
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Telefone',
      content: '(11) 9999-9999',
      link: 'tel:+5511999999999',
      description: 'Segunda a Sexta, 8h às 18h'
    },
    {
      icon: Mail,
      title: 'E-mail',
      content: 'contato@mobiliai.com.br',
      link: 'mailto:contato@mobiliai.com.br',
      description: 'Respondemos em até 24h'
    },
    {
      icon: MapPin,
      title: 'Endereço',
      content: 'Rua das Flores, 123',
      link: '#',
      description: 'São Paulo - SP, 01234-567'
    },
    {
      icon: Clock,
      title: 'Horário de Atendimento',
      content: 'Segunda a Sexta',
      link: '#',
      description: '8h às 18h | Sábado 9h às 15h'
    }
  ];

  const socialLinks = [
    { icon: Instagram, name: 'Instagram', url: 'https://instagram.com/mobiliai', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { icon: Facebook, name: 'Facebook', url: 'https://facebook.com/mobiliai', color: 'bg-blue-600' },
    { icon: Twitter, name: 'Twitter', url: 'https://twitter.com/mobiliai', color: 'bg-sky-500' },
    { icon: Linkedin, name: 'LinkedIn', url: 'https://linkedin.com/company/mobiliai', color: 'bg-blue-700' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-42">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3e2626] rounded-2xl mb-6">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3e2626] mb-4">
            Entre em Contato
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estamos aqui para ajudar! Envie sua mensagem e responderemos o mais rápido possível.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card key={index} className="border-2 border-[#3e2626]/10 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#3e2626] mb-1">{info.title}</h3>
                        <a 
                          href={info.link}
                          className="text-gray-700 hover:text-[#3e2626] transition-colors block mb-1"
                        >
                          {info.content}
                        </a>
                        <p className="text-sm text-gray-500">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Social Media */}
            <Card className="border-2 border-[#3e2626]/10">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#3e2626]">Siga-nos</CardTitle>
                <CardDescription>Conecte-se conosco nas redes sociais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${social.color} text-white p-4 rounded-xl hover:scale-105 transition-transform flex flex-col items-center justify-center space-y-2`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{social.name}</span>
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-[#3e2626]/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 rounded-t-xl">
                <CardTitle className="text-2xl font-bold text-[#3e2626]">Envie sua Mensagem</CardTitle>
                <CardDescription className="text-lg">
                  Preencha o formulário abaixo e entraremos em contato em breve
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#3e2626] mb-3">Mensagem Enviada!</h3>
                    <p className="text-gray-600 mb-6">
                      Obrigado pelo contato. Responderemos sua mensagem em até 24 horas.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      className="bg-[#3e2626] hover:bg-[#2a1a1a] text-white"
                    >
                      Enviar Nova Mensagem
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[#3e2626] font-semibold">
                          Nome Completo *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Seu nome completo"
                            className="pl-10 h-12 border-2 border-[#3e2626]/20 focus:border-[#3e2626]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#3e2626] font-semibold">
                          E-mail *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            className="pl-10 h-12 border-2 border-[#3e2626]/20 focus:border-[#3e2626]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[#3e2626] font-semibold">
                          Telefone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(11) 99999-9999"
                            className="pl-10 h-12 border-2 border-[#3e2626]/20 focus:border-[#3e2626]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-[#3e2626] font-semibold">
                          Assunto *
                        </Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            id="subject"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 h-12 border-2 border-[#3e2626]/20 rounded-md focus:outline-none focus:ring-0 focus:border-[#3e2626] bg-white"
                          >
                            <option value="">Selecione um assunto</option>
                            <option value="duvida">Dúvida sobre produtos</option>
                            <option value="pedido">Acompanhamento de pedido</option>
                            <option value="troca">Troca ou devolução</option>
                            <option value="sugestao">Sugestão ou reclamação</option>
                            <option value="parceiro">Parcerias e fornecedores</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-[#3e2626] font-semibold">
                        Mensagem *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Descreva sua dúvida, sugestão ou solicitação..."
                        rows={6}
                        className="border-2 border-[#3e2626]/20 focus:border-[#3e2626] resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#3e2626] hover:bg-[#2a1a1a] text-white h-12 text-lg font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-gray-500 text-center">
                      * Campos obrigatórios. Seus dados estão seguros conosco.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Quick Links */}
        <Card className="border-2 border-[#3e2626]/10 shadow-lg bg-gradient-to-br from-[#3e2626]/5 to-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#3e2626] text-center">
              Precisa de Ajuda Rápida?
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Confira nossas páginas de ajuda
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <a
                href="/faq"
                className="flex items-center space-x-4 p-4 bg-white rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-[#3e2626]/20"
              >
                <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#3e2626]">Perguntas Frequentes</h4>
                  <p className="text-sm text-gray-600">Respostas rápidas</p>
                </div>
              </a>

              <a
                href="/help"
                className="flex items-center space-x-4 p-4 bg-white rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-[#3e2626]/20"
              >
                <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#3e2626]">Central de Ajuda</h4>
                  <p className="text-sm text-gray-600">Guias e tutoriais</p>
                </div>
              </a>

              <a
                href="/stores"
                className="flex items-center space-x-4 p-4 bg-white rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-[#3e2626]/20"
              >
                <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#3e2626]">Nossas Lojas</h4>
                  <p className="text-sm text-gray-600">Encontre uma loja próxima</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

