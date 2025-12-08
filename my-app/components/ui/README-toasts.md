# Sistema de Toasts Melhorado

O sistema de notificações (toasts) foi completamente reformulado para oferecer uma experiência visual consistente com o design da MobiliAI.

## 🎨 Características Visuais

- **Design consistente**: Segue a paleta de cores da marca (#3e2626)
- **Tipografia elegante**: Usa a fonte Neue Montreal com espaçamento otimizado
- **Bordas arredondadas**: Border-radius consistente com o design system
- **Ícones customizados**: Cada tipo de toast tem ícone específico
- **Animações suaves**: Entrada e saída fluidas
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

## 📱 Tipos de Toast

### ✅ Success (Sucesso)
- Cor: Marrom da marca (#3e2626)
- Ícone: Check circle
- Uso: Confirmações de ações bem-sucedidas

### ❌ Error (Erro)
- Cor: Vermelha da paleta
- Ícone: Octagon X
- Uso: Falhas, erros de validação, problemas de conexão

### ⚠️ Warning (Aviso)
- Cor: Âmbar suave
- Ícone: Triangle alert
- Uso: Avisos importantes, ações que precisam de atenção

### ℹ️ Info (Informação)
- Cor: Accent foreground
- Ícone: Info circle
- Uso: Informações gerais, dicas, notificações neutras

### 🔄 Loading (Carregamento)
- Cor: Primária
- Ícone: Spinner animado
- Uso: Operações assíncronas em andamento

## 🚀 Como Usar

### Hook Personalizado (Recomendado)

```typescript
import { useToast } from '@/hooks/useToast';

function MeuComponente() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operação realizada!', {
      description: 'Os dados foram salvos com sucesso.'
    });
  };

  const handleError = () => {
    toast.error('Erro na operação', {
      description: 'Verifique sua conexão e tente novamente.'
    });
  };

  const handleWarning = () => {
    toast.warning('Atenção necessária', {
      description: 'Esta ação não pode ser desfeita.'
    });
  };

  const handleInfo = () => {
    toast.info('Nova funcionalidade', {
      description: 'Agora você pode fazer isso de forma diferente.'
    });
  };

  const handleLoading = async () => {
    const loadingToast = toast.loading('Processando...');

    try {
      await minhaOperacaoAsync();
      toast.dismiss(loadingToast);
      toast.success('Concluído!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Falhou', { description: 'Tente novamente.' });
    }
  };

  return (
    // Seu JSX
  );
}
```

### API Direta (Sonner)

```typescript
import { toast } from 'sonner';

// Uso básico
toast.success('Sucesso!');
toast.error('Erro!');

// Com descrição
toast.success('Dados salvos!', {
  description: 'As alterações foram aplicadas.'
});

// Com ação personalizada
toast.info('Nova mensagem', {
  description: 'Você tem uma nova notificação.',
  action: {
    label: 'Ver',
    onClick: () => navigate('/notifications')
  }
});
```

## ⚙️ Configuração

### Posicionamento
- **Padrão**: `bottom-right` (canto inferior direito)
- **Duracao**: 4 segundos para success/info/warning, 5 segundos para error
- **Máximo**: Até 5 toasts visíveis simultaneamente

### Tema Automático
O sistema detecta automaticamente o tema (claro/escuro) da aplicação e ajusta as cores accordingly.

## 🎯 Boas Práticas

1. **Seja conciso**: Títulos curtos, descrições claras
2. **Use descrições**: Sempre que possível, adicione contexto
3. **Seja específico**: "Cliente cadastrado" é melhor que "Sucesso"
4. **Considere ações**: Para notificações importantes, adicione botões de ação
5. **Gerencie loading states**: Sempre dismiss loading toasts antes de mostrar resultado

## 🔧 Personalização Avançada

### CSS Customizado

```css
/* Exemplo de customização adicional */
.toaster [data-sonner-toast][data-type="success"] {
  border-left: 4px solid #3e2626;
  background: linear-gradient(135deg, var(--popover) 0%, oklch(from #3e2626 l c h / 0.05) 100%);
}
```

### Configurações do Toaster

```tsx
<Toaster
  position="bottom-right"
  duration={4000}
  visibleToasts={5}
  closeButton
  richColors
/>
```

## 📱 Responsividade

- **Desktop**: Largura máxima de 420px
- **Mobile**: Largura máxima de 90% da viewport
- **Margens**: 1rem de margem lateral no mobile

## 🎨 Paleta de Cores

| Tipo | Cor Principal | Fundo | Texto |
|------|---------------|--------|-------|
| Success | #3e2626 | var(--popover) | var(--popover-foreground) |
| Error | var(--destructive) | var(--popover) | var(--popover-foreground) |
| Warning | oklch(0.828 0.189 84.429) | var(--popover) | var(--popover-foreground) |
| Info | var(--accent-foreground) | var(--popover) | var(--popover-foreground) |

---

**Nota**: Este sistema substitui completamente o toast anterior e oferece melhor consistência visual com o design da MobiliAI.