import type { ActiveOption, ActiveQuestion, ActiveTest, OptionKey } from '../models/types';

type LegacyOption = {
  claveOriginal?: OptionKey;
  letra?: OptionKey;
  texto: string;
  optionId?: string;
};

type LegacyQuestion = Omit<ActiveQuestion, 'opcionesAleatorias' | 'correctOptionId'> & {
  respuesta_correcta?: string;
  correctOptionId?: string;
  opcionesAleatorias: LegacyOption[];
};

type LegacyActiveTest = Omit<ActiveTest, 'preguntas'> & {
  preguntas: LegacyQuestion[];
};

const DEFAULT_OPTION_KEYS: OptionKey[] = ['a', 'b', 'c', 'd'];

function createFallbackOptionId(question: LegacyQuestion, questionIndex: number, optionIndex: number, letra: OptionKey): string {
  const themePart = (question.tema ?? 'tema').replace(/\s+/g, '-').toLowerCase();
  return `${themePart}-${question.numero}-${questionIndex}-${optionIndex}-${letra}`;
}

function normalizeQuestion(question: LegacyQuestion, questionIndex: number): ActiveQuestion {
  const opcionesAleatorias: ActiveOption[] = question.opcionesAleatorias.map((option, optionIndex) => {
    const letra = option.letra ?? option.claveOriginal ?? DEFAULT_OPTION_KEYS[optionIndex] ?? 'a';

    return {
      optionId: option.optionId ?? createFallbackOptionId(question, questionIndex, optionIndex, letra),
      letra,
      texto: option.texto,
    };
  });

  const correctOptionId = question.correctOptionId
    ?? opcionesAleatorias.find(option => option.letra === question.respuesta_correcta)?.optionId
    ?? opcionesAleatorias[0]?.optionId
    ?? '';

  return {
    numero: question.numero,
    enunciado: question.enunciado,
    tema: question.tema,
    explicación: question.explicación,
    opcionesAleatorias,
    correctOptionId,
  };
}

export function normalizeActiveTest(test: ActiveTest | LegacyActiveTest): ActiveTest {
  const preguntas = test.preguntas.map(normalizeQuestion);

  const respuestasUsuario = Object.fromEntries(
    Object.entries(test.respuestasUsuario ?? {}).flatMap(([index, value]) => {
      const question = preguntas[Number(index)];
      if (!question || !value) {
        return [];
      }

      const normalizedValue = question.opcionesAleatorias.some(option => option.optionId === value)
        ? value
        : question.opcionesAleatorias.find(option => option.letra === value)?.optionId;

      return normalizedValue ? [[index, normalizedValue]] : [];
    })
  ) as Record<number, string>;

  return {
    ...test,
    preguntas,
    respuestasUsuario,
  };
}

