-- Exemplo de configuração de horários de expediente para uma loja
-- Este script demonstra como configurar os horários de expediente no campo workingHours

-- Exemplo 1: Loja com horário comercial padrão (8h às 17h)
UPDATE stores 
SET working_hours = '{
  "default": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  }
}'::json
WHERE id = 'your-store-id-here';

-- Exemplo 2: Loja com horários diferenciados por dia da semana
UPDATE stores 
SET working_hours = '{
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
}'::json
WHERE id = 'your-store-id-here';

-- Exemplo 3: Loja com horário flexível (7h30 às 16h30)
UPDATE stores 
SET working_hours = '{
  "default": {
    "startTime": "07:30",
    "endTime": "16:30",
    "lunchBreakMinutes": 90,
    "regularHours": 8
  }
}'::json
WHERE id = 'your-store-id-here';

-- Exemplo 4: Loja com horário noturno (22h às 6h)
UPDATE stores 
SET working_hours = '{
  "default": {
    "startTime": "22:00",
    "endTime": "06:00",
    "lunchBreakMinutes": 30,
    "regularHours": 8
  }
}'::json
WHERE id = 'your-store-id-here';

-- Verificar a configuração atual de uma loja
SELECT id, name, working_hours 
FROM stores 
WHERE id = 'your-store-id-here';

-- Listar todas as lojas e seus horários configurados
SELECT id, name, working_hours 
FROM stores 
WHERE working_hours IS NOT NULL;
