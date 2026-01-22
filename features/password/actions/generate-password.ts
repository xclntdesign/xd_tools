export function generateSecurePassword(
  length: number,
  options: {
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
  }
) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  const pools: string[] = [];
  const required: string[] = [];

  if (options.lowercase) {
    pools.push(lowercase);
    required.push(lowercase);
  }
  if (options.uppercase) {
    pools.push(uppercase);
    required.push(uppercase);
  }
  if (options.numbers) {
    pools.push(numbers);
    required.push(numbers);
  }
  if (options.symbols) {
    pools.push(symbols);
    required.push(symbols);
  }

  if (pools.length === 0) {
    throw new Error("At least one character type must be selected.");
  }

  if (length < required.length) {
    throw new Error("Password length too short for selected options.");
  }

  const allChars = pools.join("");
  const result: string[] = [];

  // Ensure at least one from each selected pool
  for (const pool of required) {
    result.push(pool[randomInt(pool.length)]);
  }

  // Fill the rest
  while (result.length < length) {
    result.push(allChars[randomInt(allChars.length)]);
  }

  // Shuffle (Fisher–Yates)
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join("");
}

function randomInt(max: number) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}