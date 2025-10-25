# Configuração de Horários de Expediente

## Visão Geral

O sistema de ponto eletrônico agora suporta configuração personalizada de horários de expediente para cada loja. Isso permite calcular automaticamente os minutos de atraso baseado no horário de início configurado para cada loja.

## Estrutura de Configuração

### Campo `workingHours` na tabela `stores`

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

## Parâmetros de Configuração

### `startTime`
- **Tipo**: String no formato "HH:MM"
- **Descrição**: Horário de início do expediente
- **Exemplo**: "08:00", "09:30"

### `endTime`
- **Tipo**: String no formato "HH:MM"
- **Descrição**: Horário de término do expediente
- **Exemplo**: "17:00", "18:30"

### `lunchBreakMinutes`
- **Tipo**: Number
- **Descrição**: Minutos de intervalo para almoço
- **Exemplo**: 60 (1 hora), 90 (1h30min), 0 (sem intervalo)

### `regularHours`
- **Tipo**: Number
- **Descrição**: Número de horas regulares de trabalho
- **Exemplo**: 8 (8 horas), 6 (6 horas), 4 (4 horas)

## Como Funciona

### Cálculo de Atraso

1. O sistema verifica se há configuração específica para o dia da semana atual
2. Se não houver, usa a configuração padrão (`default`)
3. Se não houver configuração alguma, usa o fallback de 8:00
4. Calcula a diferença entre o horário de entrada e o horário configurado
5. Armazena os minutos de atraso no campo `minutesLate`

### Cálculo de Horas Trabalhadas

1. Calcula o tempo total entre entrada e saída
2. Subtrai o tempo de intervalo configurado
3. Calcula horas regulares (limitadas pelo valor configurado)
4. Calcula horas extras (tempo excedente às horas regulares)

## Exemplos de Uso

### Loja com Horário Comercial Padrão
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

### Loja com Horários Diferenciados por Dia
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

### Loja com Horário Flexível
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

## Fallbacks

Se não houver configuração de horários, o sistema usa os seguintes valores padrão:
- **Horário de início**: 08:00
- **Intervalo de almoço**: 60 minutos
- **Horas regulares**: 8 horas

## Benefícios

1. **Flexibilidade**: Cada loja pode ter seus próprios horários
2. **Precisão**: Cálculo automático de atrasos baseado no horário real
3. **Configuração por dia**: Suporte a horários diferentes por dia da semana
4. **Fallback seguro**: Sistema funciona mesmo sem configuração
5. **Auditoria**: Registro preciso de minutos de atraso

## Implementação

O sistema já está implementado e funcionando. Para configurar os horários de uma loja, basta atualizar o campo `workingHours` na tabela `stores` com a estrutura JSON apropriada.
