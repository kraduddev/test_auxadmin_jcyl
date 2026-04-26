import { storageService } from './storageService';
import type { TestResult } from '../models/types';

export interface TopicStats {
  tema: string;
  totalPreguntas: number;
  aciertos: number;
  fallos: number;
  blancos: number;
  porcentajeAcierto: number;
}

export const statsService = {
  getTopicStats: (): TopicStats[] => {
    const history = storageService.get<TestResult[]>('test_history') || [];
    if (history.length === 0) return [];

    const topicMap: Record<string, TopicStats> = {};

    history.forEach(test => {
      if (test.detalles && test.detalles.length > 0) {
        test.detalles.forEach(d => {
          if (!topicMap[d.tema]) {
            topicMap[d.tema] = { tema: d.tema, totalPreguntas: 0, aciertos: 0, fallos: 0, blancos: 0, porcentajeAcierto: 0 };
          }
          topicMap[d.tema].totalPreguntas++;
          if (d.estado === 'correcta') topicMap[d.tema].aciertos++;
          else if (d.estado === 'incorrecta') topicMap[d.tema].fallos++;
          else topicMap[d.tema].blancos++;
        });
      } else {
        if (!topicMap[test.tema]) {
          topicMap[test.tema] = { tema: test.tema, totalPreguntas: 0, aciertos: 0, fallos: 0, blancos: 0, porcentajeAcierto: 0 };
        }
        topicMap[test.tema].totalPreguntas += test.totalPreguntas;
        topicMap[test.tema].aciertos += test.aciertos;
        topicMap[test.tema].fallos += test.fallos;
        topicMap[test.tema].blancos += test.blancos;
      }
    });

    return Object.values(topicMap)
      .map(t => ({
        ...t,
        porcentajeAcierto: t.totalPreguntas > 0 ? (t.aciertos / t.totalPreguntas) * 100 : 0
      }))
      .sort((a, b) => b.porcentajeAcierto - a.porcentajeAcierto); // Ordenar de mayor a menor acierto
  },

  getWeakTopics: (): TopicStats[] => {
    const allStats = statsService.getTopicStats();
    if (allStats.length === 0) return [];

    // Consideramos débiles los temas con < 60% de acierto, o los 2 peores si no hay de < 60%
    const thresholdTopics = allStats.filter(t => t.porcentajeAcierto < 60);
    
    if (thresholdTopics.length > 0) {
      return thresholdTopics;
    }

    // Si todos están por encima del 60%, devolvemos el o los 2 con menor puntuación (al final del array)
    const reversed = [...allStats].reverse();
    return reversed.slice(0, Math.min(2, reversed.length));
  }
};
