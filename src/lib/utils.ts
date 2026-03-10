export function formatarCPF(cpf: string) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length > 11) cpf = cpf.slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function validarCPF(cpf: string) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const validadores = [9, 10];
  let valido = true;

  validadores.forEach((peso) => {
    let soma = 0;
    for (let i = 0; i < peso; i++) {
      soma += parseInt(cpf.charAt(i)) * (peso + 1 - i);
    }
    const resto = 11 - (soma % 11);
    const digitoVerificador = resto === 10 || resto === 11 ? 0 : resto;
    if (digitoVerificador !== parseInt(cpf.charAt(peso))) valido = false;
  });

  return valido;
}

export function formatarMicroArea(ma: string) {
  ma = ma.replace(/\D/g, '');
  if (ma.length > 2) ma = ma.slice(0, 2);
  return ma;
}

export function gerarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
