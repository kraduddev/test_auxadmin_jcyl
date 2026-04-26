import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import type { ActiveTest, TestResult } from '../models/types';
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft } from 'lucide-react';

const Results: React.FC = () => {
  const [testData, setTestData] = useState<ActiveTest | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = storageService.get<ActiveTest>('active_test');
    if (data) {
      setTestData(data);
      saveResultIfNew(data);
    }
  }, []);

  const stats = useMemo(() => {
    if (!testData) return null;

    let aciertos = 0;
    let fallos = 0;
    let blancos = 0;

    testData.preguntas.forEach((q, index) => {
      const userAnswer = testData.respuestasUsuario[index];
      if (!userAnswer) {
        blancos++;
      } else if (userAnswer === q.respuesta_correcta) {
        aciertos++;
      } else {
        fallos++;
      }
    });

    // Fórmula: Cada fallo descuenta 1/3 de un acierto
    const penalizacion = fallos * (1 / 3);
    const puntuacionNeta = Math.max(0, aciertos - penalizacion);
    const notaSobre10 = (puntuacionNeta / testData.preguntas.length) * 10;

    return {
      total: testData.preguntas.length,
      aciertos,
      fallos,
      blancos,
      puntuacionNeta: Number(puntuacionNeta.toFixed(2)),
      notaSobre10: Number(notaSobre10.toFixed(2))
    };
  }, [testData]);

  const saveResultIfNew = (data: ActiveTest) => {
    // Para evitar duplicados al recargar la página, usamos un ID compuesto
    const resultId = `${data.testId}_${data.fechaInicio}`;
    const history = storageService.get<TestResult[]>('test_history') || [];
    
    if (!history.find(h => h.id === resultId)) {
      // Calculamos las estadísticas para guardar
      let a = 0, f = 0, b = 0;
      const detalles: TestResult['detalles'] = [];

      data.preguntas.forEach((q, index) => {
        const ua = data.respuestasUsuario[index];
        let estado: 'correcta' | 'incorrecta' | 'blanco' = 'blanco';
        
        if (!ua) {
          b++;
          estado = 'blanco';
        } else if (ua === q.respuesta_correcta) {
          a++;
          estado = 'correcta';
        } else {
          f++;
          estado = 'incorrecta';
        }

        detalles.push({
          enunciado: q.enunciado,
          tema: q.tema || data.tema, // fallback por si acaso
          estado
        });
      });
      const pNeta = Math.max(0, a - (f / 3));
      const n10 = (pNeta / data.preguntas.length) * 10;

      const newResult: TestResult = {
        id: resultId,
        tema: data.tema,
        tipoTest: data.tipoTest,
        temasIncluidos: data.temasIncluidos,
        fecha: new Date().toISOString(),
        totalPreguntas: data.preguntas.length,
        aciertos: a,
        fallos: f,
        blancos: b,
        puntuacionFinal: Number(pNeta.toFixed(2)),
        notaSobre10: Number(n10.toFixed(2)),
        detalles
      };

      storageService.set('test_history', [newResult, ...history]);
      
      // Actualizar UserStats de paso
      const userStats = storageService.get<any>('user_stats') || { totalTestsTaken: 0, averageScore: 0 };
      const newTotal = userStats.totalTestsTaken + 1;
      const newAvg = ((userStats.averageScore * userStats.totalTestsTaken) + n10) / newTotal;
      
      storageService.set('user_stats', {
        totalTestsTaken: newTotal,
        averageScore: Number(newAvg.toFixed(2)),
        lastActive: new Date().toISOString()
      });
    }
  };

  if (!testData || !stats) {
    return (
      <div className="page fade-in" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>No hay resultados disponibles</h2>
        <button className="btn-primary mt-4" onClick={() => navigate('/select')}>Volver a Inicio</button>
      </div>
    );
  }

  const isApproved = stats.notaSobre10 >= 5;

  return (
    <div className="page fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Resultados del Test</h1>
          <p>{testData.tema}</p>
        </div>
        <button className="btn-option" onClick={() => { storageService.remove('active_test'); navigate('/select'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={18} /> Salir
        </button>
      </header>
      
      <div className="dashboard-cards" style={{ marginBottom: '3rem' }}>
        <div className="card score-card glass-card" style={{ gridColumn: '1 / -1', maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h2>Tu Nota Final</h2>
            <p style={{ color: 'var(--text-muted)' }}>Descontando 0.33 por fallo</p>
          </div>
          <div className="score-circle" style={{ borderColor: isApproved ? '#10b981' : '#ef4444', margin: 0 }}>
            <span className="score-value">{stats.notaSobre10}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.2rem', color: isApproved ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {isApproved ? '¡Aprobado!' : 'Suspenso'}
            </p>
            <p style={{ color: 'var(--text-muted)' }}>Puntuación Neta: {stats.puntuacionNeta} / {stats.total}</p>
          </div>
        </div>

        <div className="card glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <CheckCircle2 color="#10b981" size={32} />
             <div>
               <h3 style={{ fontSize: '2rem', marginBottom: '0' }}>{stats.aciertos}</h3>
               <p style={{ color: 'var(--text-muted)' }}>Correctas</p>
             </div>
          </div>
        </div>
        <div className="card glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <XCircle color="#ef4444" size={32} />
             <div>
               <h3 style={{ fontSize: '2rem', marginBottom: '0' }}>{stats.fallos}</h3>
               <p style={{ color: 'var(--text-muted)' }}>Incorrectas</p>
             </div>
          </div>
        </div>
        <div className="card glass-card" style={{ borderLeft: '4px solid #94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <MinusCircle color="#94a3b8" size={32} />
             <div>
               <h3 style={{ fontSize: '2rem', marginBottom: '0' }}>{stats.blancos}</h3>
               <p style={{ color: 'var(--text-muted)' }}>En blanco</p>
             </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Desglose de Respuestas</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {testData.preguntas.map((q, index) => {
          const userAnswer = testData.respuestasUsuario[index];
          const isCorrect = userAnswer === q.respuesta_correcta;
          const isBlank = !userAnswer;

          let borderColor = 'var(--glass-border)';
          let icon = <MinusCircle color="#94a3b8" />;
          if (isCorrect) {
            borderColor = '#10b981';
            icon = <CheckCircle2 color="#10b981" />;
          } else if (!isBlank) {
            borderColor = '#ef4444';
            icon = <XCircle color="#ef4444" />;
          }

          // Encontrar los textos para mostrar en lugar de las letras (opcional, pero mejor UX)
          const userAnswerText = q.opcionesAleatorias.find(o => o.claveOriginal === userAnswer)?.texto || 'No respondida';
          const correctAnswerText = q.opcionesAleatorias.find(o => o.claveOriginal === q.respuesta_correcta)?.texto || '';

          return (
            <div key={index} className="card glass-card" style={{ borderLeft: `4px solid ${borderColor}`, padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '0.2rem' }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                    {index + 1}. {q.enunciado}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Tu respuesta:</p>
                      <p style={{ color: isBlank ? 'var(--text-muted)' : (isCorrect ? '#10b981' : '#ef4444'), fontWeight: 500 }}>
                        {userAnswerText}
                      </p>
                    </div>
                    {!isCorrect && (
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Respuesta correcta:</p>
                        <p style={{ color: '#10b981', fontWeight: 500 }}>{correctAnswerText}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 600 }}>Explicación:</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{q.explicación}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Results;
