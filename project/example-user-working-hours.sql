-- Exemplo de configuração de horários de expediente individual para usuários
-- Este script demonstra como configurar os horários de expediente no campo workingHours

-- Exemplo 1: Funcionário com horário comercial padrão (8h às 17h)
UPDATE users 
SET working_hours = '{
  "default": {
    "startTime": "08:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 60,
    "regularHours": 8
  }
}'::json
WHERE id = 'user-id-here' AND role != 'CUSTOMER';

-- Exemplo 2: Funcionário com horário flexível (7h30 às 16h30)
UPDATE users 
SET working_hours = '{
  "default": {
    "startTime": "07:30",
    "endTime": "16:30",
    "lunchBreakMinutes": 90,
    "regularHours": 8
  }
}'::json
WHERE id = 'user-id-here' AND role != 'CUSTOMER';

-- Exemplo 3: Funcionário com horários diferenciados por dia da semana
UPDATE users 
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
WHERE id = 'user-id-here' AND role != 'CUSTOMER';

-- Exemplo 4: Funcionário com horário noturno (22h às 6h)
UPDATE users 
SET working_hours = '{
  "default": {
    "startTime": "22:00",
    "endTime": "06:00",
    "lunchBreakMinutes": 30,
    "regularHours": 8
  }
}'::json
WHERE id = 'user-id-here' AND role != 'CUSTOMER';

-- Exemplo 5: Funcionário com horário de meio período
UPDATE users 
SET working_hours = '{
  "default": {
    "startTime": "13:00",
    "endTime": "17:00",
    "lunchBreakMinutes": 0,
    "regularHours": 4
  }
}'::json
WHERE id = 'user-id-here' AND role != 'CUSTOMER';

-- Verificar a configuração atual de um usuário
SELECT id, name, email, role, working_hours 
FROM users 
WHERE id = 'user-id-here';

-- Listar todos os funcionários e seus horários configurados
SELECT id, name, email, role, working_hours 
FROM users 
WHERE working_hours IS NOT NULL AND role != 'CUSTOMER';

-- Listar funcionários sem horário configurado (usarão horário da loja)
SELECT id, name, email, role, store_id
FROM users 
WHERE working_hours IS NULL AND role != 'CUSTOMER';

-- Criar usuário com horário de expediente já configurado
INSERT INTO users (
  id, email, password, name, role, store_id, is_active, working_hours, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'funcionario@example.com',
  '$2a$10$hashedpassword',
  'João Silva',
  'EMPLOYEE',
  'store-id-here',
  true,
  '{
    "default": {
      "startTime": "08:00",
      "endTime": "17:00",
      "lunchBreakMinutes": 60,
      "regularHours": 8
    }
  }'::json,
  NOW(),
  NOW()
);
