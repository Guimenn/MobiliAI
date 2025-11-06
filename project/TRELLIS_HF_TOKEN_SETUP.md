# 🔑 Configuração do Token do Hugging Face para Trellis

## 📋 O que é isso?

O token do Hugging Face é usado para ter **prioridade maior na fila do ZeroGPU** ao usar o serviço Trellis para gerar modelos 3D. Sem o token, você terá menor prioridade e pode enfrentar timeouts quando o serviço estiver sobrecarregado.

## 🚀 Como configurar

### Opção 1: Variável de Ambiente (Recomendado)

Crie um arquivo `.env` na raiz do projeto `project/` e adicione:

```env
HF_TOKEN=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
```

Ou você pode usar qualquer um desses nomes:
- `HF_TOKEN`
- `HUGGINGFACE_TOKEN`
- `HUGGING_FACE_HUB_TOKEN`

### Opção 2: Exportar no Terminal (Temporário)

```bash
export HF_TOKEN=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
```

⚠️ **Nota:** Esta configuração é temporária e só dura enquanto o terminal estiver aberto.

## ✅ Verificar se está funcionando

Quando você iniciar o servidor NestJS, você verá uma das seguintes mensagens:

**Com token configurado:**
```
[TrellisService] Hugging Face token encontrado - será usado para prioridade na fila ZeroGPU
[TrellisService] Hugging Face token configurado para maior prioridade na fila ZeroGPU
```

**Sem token:**
```
[TrellisService] Hugging Face token não encontrado - usando serviço sem autenticação (menor prioridade)
```

## 📝 Exemplo de arquivo .env completo

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/loja_tintas?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui

# Hugging Face (para Trellis/ZeroGPU)
HF_TOKEN=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

# Outras configurações...
```

## 🔒 Segurança

⚠️ **IMPORTANTE:** 
- **NUNCA** commite o arquivo `.env` com o token no Git
- O arquivo `.env` já deve estar no `.gitignore`
- Se você precisar compartilhar a configuração, use um arquivo `.env.example` sem valores reais

## 🎯 Benefícios

Com o token configurado:
- ✅ Prioridade maior na fila do ZeroGPU
- ✅ Menos timeouts de "No GPU available"
- ✅ Processamento mais rápido quando há concorrência
- ✅ Melhor experiência para o usuário

## 🔧 Troubleshooting

### Token não está sendo detectado

1. Verifique se o arquivo `.env` está na pasta `project/`
2. Verifique se o nome da variável está correto (`HF_TOKEN`)
3. Reinicie o servidor NestJS após adicionar o token
4. Verifique os logs do servidor para confirmar se o token foi detectado

### Ainda recebe timeout mesmo com token

- O token garante prioridade maior, mas não garante disponibilidade imediata
- Em horários de pico, mesmo com token pode haver espera
- Tente novamente em alguns minutos

