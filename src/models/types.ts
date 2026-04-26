export interface TestProgress {
  id: string;
  testId: string;
  status: 'in-progress' | 'completed';
  score?: number;
  date: string;
}

export interface UserStats {
  totalTestsTaken: number;
  averageScore: number;
  lastActive: string;
}

export interface Question {
  numero: number;
  enunciado: string;
  opciones: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  respuesta_correcta: string;
  tema?: string;
  explicación: string;
}

export interface Test {
  tema: string;
  preguntas: Question[];
}

export interface ActiveQuestion extends Omit<Question, 'opciones'> {
  // Array de opciones aleatorias, cada una con su clave original y valor
  opcionesAleatorias: { claveOriginal: 'a' | 'b' | 'c' | 'd'; texto: string }[];
}

export interface ActiveTest {
  testId: string; // Puede ser el nombre del tema por ahora
  tema: string;
  tipoTest: 'tema' | 'aleatorio';
  temasIncluidos: string[];
  preguntas: ActiveQuestion[];
  respuestasUsuario: Record<number, 'a' | 'b' | 'c' | 'd'>; // key: numero de index, value: claveOriginal elegida
  fechaInicio: string;
}

export interface DetalleRespuesta {
  enunciado: string;
  tema: string;
  estado: 'correcta' | 'incorrecta' | 'blanco';
}

export interface TestResult {
  id: string;
  tema: string;
  tipoTest: 'tema' | 'aleatorio';
  temasIncluidos: string[];
  fecha: string;
  totalPreguntas: number;
  aciertos: number;
  fallos: number;
  blancos: number;
  puntuacionFinal: number; // Teniendo en cuenta la penalización
  notaSobre10: number;
  detalles: DetalleRespuesta[];
}
