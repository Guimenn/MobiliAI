// Utilitários para formatação e validação de campos de entrada

export const formatCPF = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a máscara
  return limitedNumbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatCEP = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 8 dígitos
  const limitedNumbers = numbers.slice(0, 8);
  
  // Aplica a máscara
  return limitedNumbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

export const formatPhone = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a máscara
  return limitedNumbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3');
};

export const formatState = (value: string): string => {
  // Limita a 2 caracteres e converte para maiúsculo
  return value.slice(0, 2).toUpperCase();
};

export const formatCity = (value: string): string => {
  // Limita a 50 caracteres
  return value.slice(0, 50);
};

export const formatAddress = (value: string): string => {
  // Limita a 100 caracteres
  return value.slice(0, 100);
};

export const formatName = (value: string): string => {
  // Limita a 100 caracteres
  return value.slice(0, 100);
};

export const formatEmail = (value: string): string => {
  // Limita a 100 caracteres
  return value.slice(0, 100);
};

// Validações
export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.length === 11;
};

export const validateCEP = (cep: string): boolean => {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
};

export const validatePhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Handlers para inputs
export const createInputHandler = (
  formatter: (value: string) => string,
  setValue: (value: string) => void
) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatter(e.target.value);
    setValue(formattedValue);
  };
};
