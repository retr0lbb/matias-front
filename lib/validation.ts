const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

/** Keeps only the digits of a CPF (users paste it with or without dots). */
export function cpfDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

/** Formats as you type: "12345678909" → "123.456.789-09". */
export function formatCpf(value: string) {
  const d = cpfDigits(value);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Checks the two CPF check digits (and rejects "111.111.111-11" etc.). */
export function isCpf(value: string) {
  const d = cpfDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(d[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}
