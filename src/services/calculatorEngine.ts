/**
 * Motore di calcolo matematico in tempo reale sicuro e privo di eval().
 * Utilizza l'algoritmo Shunting-Yard per convertire le espressioni in Reverse Polish Notation (RPN)
 * e valutarle con precedenza degli operatori e supporto per funzioni e percentuali.
 */

export interface MathEvaluationResult {
  expression: string;
  result: number;
  formatted: string;
}

type TokenType = 'NUMBER' | 'OP' | 'FUNC' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
  precedence?: number;
  associativity?: 'left' | 'right';
}

const OPERATORS: Record<string, { precedence: number; associativity: 'left' | 'right' }> = {
  '+': { precedence: 2, associativity: 'left' },
  '-': { precedence: 2, associativity: 'left' },
  '*': { precedence: 3, associativity: 'left' },
  '/': { precedence: 3, associativity: 'left' },
  '%': { precedence: 3, associativity: 'left' },
  '^': { precedence: 4, associativity: 'right' },
};

const FUNCTIONS = new Set(['sqrt', 'abs', 'sin', 'cos', 'tan', 'round', 'floor', 'ceil', 'log', 'ln']);

/** Pre-processa l'input per supportare notazioni comuni come 'x', '% of', 'pi', 'e' */
function preprocess(raw: string): string {
  let s = raw.trim();

  // Gestione 'X% of Y' -> '(X / 100) * Y'
  const percentOfRegex = /([0-9.]+)\s*%\s*of\s*([0-9.]+)/gi;
  s = s.replace(percentOfRegex, '($1 / 100) * $2');

  // Sostituisci moltiplicatori comuni '×' o 'x' tra cifre
  s = s.replace(/([0-9])\s*[x×]\s*([0-9])/gi, '$1 * $2');

  // Costanti matematiche
  s = s.replace(/\bpi\b/gi, String(Math.PI));
  s = s.replace(/\be\b/g, String(Math.E));

  return s;
}

/** Tokenizer per espressioni algebriche */
function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    if (!ch) {
      i++;
      continue;
    }

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numeri (inclusi decimali)
    const nextCh = expr[i + 1];
    if (/[0-9]/.test(ch) || (ch === '.' && nextCh !== undefined && /[0-9]/.test(nextCh))) {
      let numStr = '';
      let hasDot = false;
      while (i < expr.length) {
        const charAtI = expr[i];
        if (!charAtI) break;
        if (/[0-9]/.test(charAtI) || charAtI === '.') {
          if (charAtI === '.') {
            if (hasDot) return null; // due punti decimali
            hasDot = true;
          }
          numStr += charAtI;
          i++;
        } else {
          break;
        }
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Operatori aritmetici
    if (ch in OPERATORS) {
      // Gestione segno meno unario (es. all'inizio o dopo una parentesi aperta)
      const lastToken = tokens[tokens.length - 1];
      if (
        ch === '-' &&
        (!lastToken || lastToken.type === 'LPAREN' || lastToken.type === 'OP')
      ) {
        // Meno unario -> 0 - x
        tokens.push({ type: 'NUMBER', value: '0' });
      }
      const opInfo = OPERATORS[ch as keyof typeof OPERATORS];
      if (!opInfo) return null;
      tokens.push({
        type: 'OP',
        value: ch,
        precedence: opInfo.precedence,
        associativity: opInfo.associativity,
      });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Funzioni matematiche (sqrt, sin, cos, abs...)
    if (/[a-zA-Z]/.test(ch)) {
      let funcStr = '';
      while (i < expr.length) {
        const charAtI = expr[i];
        if (!charAtI || !/[a-zA-Z]/.test(charAtI)) break;
        funcStr += charAtI.toLowerCase();
        i++;
      }
      if (FUNCTIONS.has(funcStr)) {
        tokens.push({ type: 'FUNC', value: funcStr });
        continue;
      } else {
        return null; // parola non riconosciuta
      }
    }

    return null; // carattere non valido
  }

  return tokens;
}

/** Algoritmo Shunting-Yard (Infix -> RPN) */
function shuntingYard(tokens: Token[]): Token[] | null {
  const outputQueue: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'NUMBER') {
      outputQueue.push(token);
    } else if (token.type === 'FUNC') {
      operatorStack.push(token);
    } else if (token.type === 'OP') {
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (!top) break;
        if (top.type === 'FUNC') {
          const popped = operatorStack.pop();
          if (popped) outputQueue.push(popped);
        } else if (
          top.type === 'OP' &&
          top.precedence !== undefined &&
          token.precedence !== undefined &&
          ((token.associativity === 'left' && token.precedence <= top.precedence) ||
            (token.associativity === 'right' && token.precedence < top.precedence))
        ) {
          const popped = operatorStack.pop();
          if (popped) outputQueue.push(popped);
        } else {
          break;
        }
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      let foundMatchingLparen = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop();
        if (!top) break;
        if (top.type === 'LPAREN') {
          foundMatchingLparen = true;
          break;
        } else {
          outputQueue.push(top);
        }
      }
      if (!foundMatchingLparen) return null;
      const topAfter = operatorStack[operatorStack.length - 1];
      if (topAfter && topAfter.type === 'FUNC') {
        const popped = operatorStack.pop();
        if (popped) outputQueue.push(popped);
      }
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack.pop();
    if (!top) break;
    if (top.type === 'LPAREN' || top.type === 'RPAREN') return null;
    outputQueue.push(top);
  }

  return outputQueue;
}

/** Valutazione dell'espressione RPN */
function evaluateRpn(rpn: Token[]): number | null {
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.type === 'NUMBER') {
      const val = parseFloat(token.value);
      if (Number.isNaN(val)) return null;
      stack.push(val);
    } else if (token.type === 'OP') {
      if (stack.length < 2) return null;
      const b = stack.pop()!;
      const a = stack.pop()!;
      let res: number;
      switch (token.value) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) return null; // divisione per zero
          res = a / b;
          break;
        case '%':
          res = a % b;
          break;
        case '^':
          res = Math.pow(a, b);
          break;
        default:
          return null;
      }
      stack.push(res);
    } else if (token.type === 'FUNC') {
      if (stack.length < 1) return null;
      const a = stack.pop()!;
      let res: number;
      switch (token.value) {
        case 'sqrt':
          if (a < 0) return null;
          res = Math.sqrt(a);
          break;
        case 'abs':
          res = Math.abs(a);
          break;
        case 'sin':
          res = Math.sin(a);
          break;
        case 'cos':
          res = Math.cos(a);
          break;
        case 'tan':
          res = Math.tan(a);
          break;
        case 'round':
          res = Math.round(a);
          break;
        case 'floor':
          res = Math.floor(a);
          break;
        case 'ceil':
          res = Math.ceil(a);
          break;
        case 'log':
        case 'ln':
          if (a <= 0) return null;
          res = Math.log(a);
          break;
        default:
          return null;
      }
      stack.push(res);
    }
  }

  if (stack.length !== 1) return null;
  const finalVal = stack[0];
  if (finalVal === undefined || Number.isNaN(finalVal) || !Number.isFinite(finalVal)) return null;
  return finalVal;
}

/** Formatta il risultato numerico con separatori e precisione intelligente */
function formatNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toLocaleString('it-IT');
  }
  // Max 6 decimali significativi
  const rounded = parseFloat(num.toFixed(6));
  return rounded.toLocaleString('it-IT', { maximumFractionDigits: 6 });
}

/**
 * Valuta un'espressione matematica; ritorna null se non è un calcolo valido o se è solo testo generico.
 */
export function evaluateMathExpression(input: string): MathEvaluationResult | null {
  const trimmed = input.trim();
  if (trimmed.length < 2) return null;

  // Conversioni esadecimali o binarie speciali
  const hasConversion = /\b(hex|bin)\s*\(\s*[0-9]+\s*\)/i.test(trimmed);
  if (hasConversion) {
    const hexMatch = trimmed.match(/\bhex\s*\(\s*([0-9]+)\s*\)/i);
    const hexDigits = hexMatch?.[1];
    if (hexDigits) {
      const val = parseInt(hexDigits, 10);
      return {
        expression: trimmed,
        result: val,
        formatted: `0x${val.toString(16).toUpperCase()}`,
      };
    }
    const binMatch = trimmed.match(/\bbin\s*\(\s*([0-9]+)\s*\)/i);
    const binDigits = binMatch?.[1];
    if (binDigits) {
      const val = parseInt(binDigits, 10);
      return {
        expression: trimmed,
        result: val,
        formatted: `0b${val.toString(2)}`,
      };
    }
  }

  const processed = preprocess(trimmed);
  const hasOperator = /[+\-*/^%]/.test(processed);
  const hasFunction = new RegExp(`\\b(${Array.from(FUNCTIONS).join('|')})\\s*\\(`, 'i').test(processed);

  if (!hasOperator && !hasFunction) {
    return null;
  }

  const tokens = tokenize(processed);
  if (!tokens || tokens.length < 2) return null;

  const rpn = shuntingYard(tokens);
  if (!rpn) return null;

  const res = evaluateRpn(rpn);
  if (res === null) return null;

  return {
    expression: trimmed,
    result: res,
    formatted: formatNumber(res),
  };
}
