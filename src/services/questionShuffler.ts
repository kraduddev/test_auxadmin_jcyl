import type { Question } from '../models/types';

type OptionKey = 'a' | 'b' | 'c' | 'd';
type LetterMap = Record<OptionKey, OptionKey>;

// ─────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────

/**
 * Mezcla un array con el algoritmo Fisher-Yates.
 * Función pura: devuelve un nuevo array sin mutar el original.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─────────────────────────────────────────────
// Detección de opciones "ancla"
// ─────────────────────────────────────────────

const ANCHOR_PATTERNS = [
  /todas\s+las\s+anteriores/i,
  /ninguna\s+de\s+las\s+anteriores/i,
];

function hasAnchorOption(opciones: Question['opciones']): boolean {
  return (Object.values(opciones) as string[]).some(text =>
    ANCHOR_PATTERNS.some(pattern => pattern.test(text))
  );
}

// ─────────────────────────────────────────────
// Reescritura de referencias internas
// ─────────────────────────────────────────────

/**
 * Sustituye en `text` todas las referencias a letras de opción
 * según el mapa `oldLetter → newLetter`.
 *
 * Cubre:
 *   • "a)", "b)", "c)", "d)"             → patrón principal
 *   • "opción a", "opciones b y c"       → variante con substantivo
 *   • "respuesta b", "respuestas a y d"  → variante con substantivo
 */
export function rewriteReferences(text: string, map: LetterMap): string {
  // Patrón 1 (requerido): letra seguida de paréntesis  →  a), b), c), d)
  let result = text.replace(/\b([abcd])\)/gi, (_, letter: string) => {
    const key = letter.toLowerCase() as OptionKey;
    const newLetter = map[key] ?? key;
    // Preservar la capitalización original
    return letter === letter.toUpperCase()
      ? `${newLetter.toUpperCase()})`
      : `${newLetter})`;
  });

  // Patrón 2 (extra): "opción/opciones X"
  result = result.replace(
    /\b(opci[oó]n(?:es)?)\s+([abcd])\b/gi,
    (_, prefix: string, letter: string) => {
      const key = letter.toLowerCase() as OptionKey;
      const newLetter = map[key] ?? key;
      return `${prefix} ${newLetter}`;
    }
  );

  // Patrón 3 (extra): "respuesta/respuestas X"
  result = result.replace(
    /\b(respuestas?)\s+([abcd])\b/gi,
    (_, prefix: string, letter: string) => {
      const key = letter.toLowerCase() as OptionKey;
      const newLetter = map[key] ?? key;
      return `${prefix} ${newLetter}`;
    }
  );

  return result;
}

// ─────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────

/**
 * Mezcla las opciones de una pregunta manteniendo la coherencia interna:
 *
 * 1. Si alguna opción contiene "todas/ninguna de las anteriores",
 *    devuelve la pregunta sin modificar.
 * 2. Reordena las opciones aleatoriamente y reasigna letras a–d.
 * 3. Reescribe las referencias a letras dentro de los textos de
 *    opciones, enunciado y explicación.
 * 4. Actualiza `respuesta_correcta` a la nueva letra.
 *
 * Es una función pura: no muta el objeto original.
 */
export function shuffleQuestionOptions(question: Question): Question {
  // Guardia: no mezclar si hay opción ancla
  if (hasAnchorOption(question.opciones)) {
    return question;
  }

  const keys: OptionKey[] = ['a', 'b', 'c', 'd'];
  const shuffledKeys = shuffle(keys); // e.g. ['c', 'a', 'd', 'b']

  // Mapa: letra original → nueva letra asignada
  // shuffledKeys[0] pasa a ser 'a', [1] → 'b', etc.
  const oldToNew = {} as LetterMap;
  shuffledKeys.forEach((oldKey, newIndex) => {
    oldToNew[oldKey] = keys[newIndex];
  });

  // Construir nuevas opciones con textos reescritos
  const newOpciones = {} as Question['opciones'];
  shuffledKeys.forEach((oldKey, newIndex) => {
    const newKey = keys[newIndex];
    newOpciones[newKey] = rewriteReferences(question.opciones[oldKey], oldToNew);
  });

  // Reescribir también enunciado y explicación
  const newEnunciado = rewriteReferences(question.enunciado, oldToNew);
  const newExplicacion = rewriteReferences(question['explicación'], oldToNew);

  // Actualizar respuesta correcta
  const oldCorrect = question.respuesta_correcta as OptionKey;
  const newCorrect = oldToNew[oldCorrect] ?? oldCorrect;

  return {
    ...question,
    enunciado: newEnunciado,
    opciones: newOpciones,
    respuesta_correcta: newCorrect,
    'explicación': newExplicacion,
  };
}

