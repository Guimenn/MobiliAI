# Requirements Document

## Introduction

Este documento define os requisitos para corrigir o problema de dados mockados no sistema de ponto eletrônico. Atualmente, alguns endpoints estão retornando dados simulados em vez de integrar com o banco de dados real, causando inconsistências na aplicação.

## Glossary

- **Time_Clock_System**: Sistema de controle de ponto eletrônico que gerencia entrada e saída de funcionários
- **Mock_Data**: Dados simulados/falsos retornados pelos endpoints em vez de dados reais do banco
- **Real_Data**: Dados autênticos armazenados e recuperados do banco de dados
- **Time_Clock_Record**: Registro individual de ponto contendo informações de entrada/saída de um funcionário
- **Employee**: Funcionário da empresa que utiliza o sistema de ponto

## Requirements

### Requirement 1

**User Story:** Como administrador do sistema, eu quero que todos os endpoints de ponto eletrônico retornem dados reais do banco de dados, para que eu possa ter informações precisas sobre a presença dos funcionários.

#### Acceptance Criteria

1. WHEN um ponto é registrado via endpoint `/time-clock`, THE Time_Clock_System SHALL armazenar os dados no banco de dados real
2. WHEN um ponto é registrado via endpoint `/simple-time-clock/register`, THE Time_Clock_System SHALL armazenar os dados no banco de dados real
3. WHEN dados de ponto são solicitados, THE Time_Clock_System SHALL retornar apenas Real_Data do banco de dados
4. THE Time_Clock_System SHALL eliminar todos os Mock_Data dos endpoints de registro de ponto
5. THE Time_Clock_System SHALL manter consistência entre todos os endpoints de time clock

### Requirement 2

**User Story:** Como funcionário, eu quero que meu registro de ponto seja salvo corretamente no sistema, para que minha presença seja registrada adequadamente.

#### Acceptance Criteria

1. WHEN um Employee registra ponto de entrada, THE Time_Clock_System SHALL criar um Time_Clock_Record no banco de dados
2. WHEN um Employee registra ponto de saída, THE Time_Clock_System SHALL atualizar o Time_Clock_Record existente
3. THE Time_Clock_System SHALL validar se o Employee existe antes de registrar o ponto
4. THE Time_Clock_System SHALL calcular automaticamente horas trabalhadas e horas extras
5. THE Time_Clock_System SHALL retornar confirmação com dados reais após o registro

### Requirement 3

**User Story:** Como gerente de loja, eu quero visualizar o histórico real de pontos dos funcionários, para que eu possa monitorar a assiduidade corretamente.

#### Acceptance Criteria

1. WHEN o histórico de pontos é solicitado, THE Time_Clock_System SHALL retornar apenas Real_Data do banco
2. THE Time_Clock_System SHALL permitir filtros por data de início e fim
3. THE Time_Clock_System SHALL calcular estatísticas precisas baseadas em Real_Data
4. THE Time_Clock_System SHALL exibir status correto (presente, atrasado, ausente) baseado em dados reais
5. THE Time_Clock_System SHALL manter consistência entre diferentes visualizações de dados