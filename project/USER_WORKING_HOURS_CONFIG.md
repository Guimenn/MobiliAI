# Configuração de Horários de Expediente Individual dos Usuários

## Visão Geral

O sistema agora suporta configuração de horários de expediente individuais para cada funcionário/usuário. Isso permite que cada funcionário tenha seu próprio horário de trabalho, independente da loja onde trabalha.

## Prioridade de Configuração

O sistema usa a seguinte ordem de prioridade para determinar o horário de expediente:

1. **Horário individual do usuário** (campo `workingHours` na tabela `users`)
2. **Horário da loja** (campo `workingHours` na tabela `stores`)
3. **Fallback padrão** (8:00, 60min de almoço, 8h regulares)

## Estrutura de Configuração

### Campo `workingHours` na tabela `users`

O campo `workingHours` é um campo JSON que pode conter as seguintes configurações:

```json
{
  "default": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  },
  "segunda-feira": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  },
  "terça-feira": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  },
  "quarta-feira": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  },
  "quinta-feira": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  },
  "sexta-feira": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  },
  "sábado": {
    "startTime": "09:00",
    "endTime": "13:00",
    "lunchBreakMinutes": 0,
    "regularHours": 4
  },
  "domingo": {
    "startTime": "09:00",
    "endTime": "13:00",
    "lunchBreakMinutes": 0,
    "regularHours": 4
  }
}
```

## Endpoints da API

### Configurar Horário de Expediente de um Usuário

```http
PUT /api/admin/users/:id/working-hours
Content-Type: application/json
Authorization: Bearer <token>

{
  "workingHours": {
    "default": {
      "startTime": "08:00",
      "endTime": "17:00",
      "lunchBreakMinutes": 60,
      "regularHours": 8
    }
  }
}
```

### Atualizar Usuário (incluindo horário de expediente)

```http
PUT /api/admin/users/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "João Silva",
  "email": "joao@example.com",
  "workingHours": {
    "default": {
      "startTime": "07:30",
      "endTime": "16:30",
      "lunchBreakMinutes": 90,
      "regularHours": 8
    }
  }
}
```

## Exemplos de Configuração

### Funcionário com Horário Comercial Padrão
```json
{
  "default": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  }
}
```

### Funcionário com Horário Flexível
```json
{
  "default": {
    "startTime": "07:30",
    "endTime": "16:30",
    "lunchBreakMinutes": 90,
    "regularHours": 8
  }
}
```

### Funcionário com Horário Diferenciado por Dia
```json
{
  "default": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  },
  "sábado": {
    "startTime": "09:00",
    "endTime": "13:00",
    "lunchBreakMinutes": 0,
    "regularHours": 4
  },
  "domingo": {
    "startTime": "09:00",
    "endTime": "13:00",
    "lunchBreakMinutes": 0,
    "regularHours": 4
  }
}
```

### Funcionário com Horário Noturno
```json
{
  "default": {
    "startTime": "22:00",
    "endTime": "06:00",
    "lunchBreakMinutes": 30,
    "regularHours": 8
  }
}
```

## Como Funciona

### Cálculo de Atraso

1. O sistema verifica se o usuário tem horário individual configurado
2. Se não houver, usa o horário da loja
3. Se não houver configuração alguma, usa o fallback de 8:00
4. Calcula a diferença entre o horário de entrada e o horário configurado
5. Armazena os minutos de atraso no campo `minutesLate`

### Cálculo de Horas Trabalhadas

1. Calcula o tempo total entre entrada e saída
2. Subtrai o tempo de intervalo configurado (individual ou da loja)
3. Calcula horas regulares (limitadas pelo valor configurado)
4. Calcula horas extras (tempo excedente às horas regulares)

## Validações

- Apenas funcionários (não clientes) podem ter horário de expediente configurado
- O horário individual tem prioridade sobre o horário da loja
- Se não houver configuração individual, usa o horário da loja
- Se não houver configuração alguma, usa valores padrão

## Benefícios

1. **Flexibilidade**: Cada funcionário pode ter seu próprio horário
2. **Precisão**: Cálculo automático de atrasos baseado no horário individual
3. **Configuração por dia**: Suporte a horários diferentes por dia da semana
4. **Priorização**: Horário individual tem prioridade sobre o da loja
5. **Fallback seguro**: Sistema funciona mesmo sem configuração

## Implementação

O sistema já está implementado e funcionando. Para configurar o horário de um funcionário, basta usar o endpoint `/api/admin/users/:id/working-hours` ou atualizar o usuário com o campo `workingHours`.
