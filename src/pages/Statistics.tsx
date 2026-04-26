import React, { useMemo } from 'react';
import { storageService } from '../services/storageService';
import { statsService } from '../services/statsService';
import type { TestResult } from '../models/types';
import { TrendingUp, TrendingDown, Target, Award, BrainCircuit, Activity } from 'lucide-react';

const Statistics: React.FC = () => {
  const history = storageService.get<TestResult[]>('test_history') || [];

  const stats = useMemo(() => {
    if (history.length === 0) return null;

    let totalPreguntas = 0;
    let totalAciertos = 0;

    history.forEach(test => {
      if (test.detalles && test.detalles.length > 0) {
        test.detalles.forEach(d => {
          totalPreguntas++;
          if (d.estado === 'correcta') totalAciertos++;
        });
      } else {
        totalPreguntas += test.totalPreguntas;
        totalAciertos += test.aciertos;
      }
    });

    const topicStatsArray = statsService.getTopicStats();

    // Identificar destacables (solo temas con >= 3 preguntas para ser representativo)
    const validTopics = topicStatsArray.filter(t => t.totalPreguntas >= 3);
    const useTopics = validTopics.length > 0 ? validTopics : topicStatsArray;
    
    const bestTopic = useTopics.length > 0 ? useTopics[0] : null;
    const worstTopic = useTopics.length > 1 ? useTopics[useTopics.length - 1] : null;

    return {
      totalTests: history.length,
      globalAccuracy: totalPreguntas > 0 ? (totalAciertos / totalPreguntas) * 100 : 0,
      topicStatsArray,
      bestTopic,
      worstTopic
    };
  }, [history]);

  if (!stats) {
    return (
      <div className="page fade-in" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Aún no hay estadísticas</h2>
        <p style={{ color: 'var(--text-muted)' }}>Realiza al menos un test para ver tu análisis de rendimiento.</p>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <header className="page-header">
        <h1>Análisis de Rendimiento</h1>
        <p>Tus estadísticas detalladas basadas en {stats.totalTests} tests</p>
      </header>
      
      <div className="dashboard-cards" style={{ marginBottom: '3rem' }}>
        <div className="card glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
           <Target color="var(--primary-color)" size={32} />
           <div>
             <h3 style={{ fontSize: '2rem', marginBottom: '0' }}>{stats.globalAccuracy.toFixed(1)}%</h3>
             <p style={{ color: 'var(--text-muted)' }}>Acierto Global</p>
           </div>
        </div>
        <div className="card glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
           <Award color="#10b981" size={32} />
           <div>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '0' }}>{stats.totalTests}</h3>
             <p style={{ color: 'var(--text-muted)' }}>Tests Realizados</p>
           </div>
        </div>
        <div className="card glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #8b5cf6' }}>
           <BrainCircuit color="#8b5cf6" size={32} />
           <div>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '0' }}>{stats.topicStatsArray.length}</h3>
             <p style={{ color: 'var(--text-muted)' }}>Temas Practicados</p>
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.bestTopic && (
          <div className="card glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#10b981' }}>
              <TrendingUp size={24} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Tema más dominado</h3>
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{stats.bestTopic.tema}</p>
            <p style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.bestTopic.porcentajeAcierto.toFixed(1)}% acierto</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Basado en {stats.bestTopic.totalPreguntas} preguntas</p>
          </div>
        )}

        {stats.worstTopic && stats.worstTopic.tema !== stats.bestTopic?.tema && (
          <div className="card glass-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
              <TrendingDown size={24} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Punto débil a repasar</h3>
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{stats.worstTopic.tema}</p>
            <p style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.worstTopic.porcentajeAcierto.toFixed(1)}% acierto</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Has fallado {stats.worstTopic.fallos} de {stats.worstTopic.totalPreguntas} preguntas</p>
          </div>
        )}
      </div>

      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={24} color="var(--primary-color)" /> Desglose por Temas
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {stats.topicStatsArray.map((topic, index) => {
          let color = '#ef4444'; // Red
          if (topic.porcentajeAcierto >= 80) color = '#10b981'; // Green
          else if (topic.porcentajeAcierto >= 50) color = '#f59e0b'; // Yellow

          return (
            <div key={index} className="card glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div style={{ maxWidth: '70%' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic.tema}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {topic.aciertos} correctas, {topic.fallos} incorrectas ({topic.totalPreguntas} total)
                  </p>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>
                  {topic.porcentajeAcierto.toFixed(1)}%
                </div>
              </div>
              
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${topic.porcentajeAcierto}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Statistics;
