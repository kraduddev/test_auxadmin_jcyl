import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import type { ActiveTest } from '../models/types';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Eye, Info } from 'lucide-react';

const ExecuteTest: React.FC = () => {
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  
  const navigate = useNavigate();

  useEffect(() => {
    const test = storageService.get<ActiveTest>('active_test');
    if (test) {
      setActiveTest(test);
    }
  }, []);

  if (!activeTest) {
    return (
      <div className="page fade-in" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>No hay ningún test en curso</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Por favor, selecciona o genera un test primero.</p>
        <button className="btn-primary" onClick={() => navigate('/select')}>Ir a Selección de Test</button>
      </div>
    );
  }

  const currentQuestion = activeTest.preguntas[currentIndex];
  const progressPercentage = ((currentIndex + 1) / activeTest.preguntas.length) * 100;
  
  // Guardar respuesta del usuario
  const handleOptionSelect = (claveOriginal: 'a' | 'b' | 'c' | 'd') => {
    if (revealed[currentIndex]) return; // No permitir cambiar si ya vio la solución

    const updatedTest = { ...activeTest };
    updatedTest.respuestasUsuario[currentIndex] = claveOriginal;
    
    setActiveTest(updatedTest);
    storageService.set('active_test', updatedTest);
  };

  const handleReveal = () => {
    setRevealed(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (currentIndex < activeTest.preguntas.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    if (window.confirm('¿Estás seguro de que quieres finalizar el test?')) {
      navigate('/results');
    }
  };

  const selectedAnswer = activeTest.respuestasUsuario[currentIndex];

  return (
    <div className="page fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>{activeTest.tema}</h1>
          <p>Pregunta {currentIndex + 1} de {activeTest.preguntas.length}</p>
        </div>
        <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={handleFinish}>
          Finalizar Test
        </button>
      </header>
      
      <div className="card execution-card glass-card">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        
        <h2 className="question-text">{currentQuestion.enunciado}</h2>
        
        <div className="options-grid">
          {currentQuestion.opcionesAleatorias.map((opcion, idx) => {
            const isSelected = selectedAnswer === opcion.claveOriginal;
            const isRevealed = revealed[currentIndex];
            const isCorrect = opcion.claveOriginal === currentQuestion.respuesta_correcta;
            
            let backgroundColor = isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)';
            let borderColor = isSelected ? 'var(--primary-color)' : 'var(--glass-border)';
            let boxShadow = isSelected ? '0 0 10px rgba(99, 102, 241, 0.2)' : 'none';

            if (isRevealed) {
              if (isCorrect) {
                backgroundColor = 'rgba(16, 185, 129, 0.15)'; // Verde
                borderColor = '#10b981';
                boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
              } else if (isSelected) {
                backgroundColor = 'rgba(239, 68, 68, 0.15)'; // Rojo
                borderColor = '#ef4444';
                boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
              } else {
                backgroundColor = 'rgba(255, 255, 255, 0.02)';
                borderColor = 'rgba(255, 255, 255, 0.05)';
              }
            }

            return (
              <button 
                key={idx} 
                className={`btn-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(opcion.claveOriginal)}
                disabled={isRevealed}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderColor,
                  background: backgroundColor,
                  boxShadow,
                  cursor: isRevealed ? 'default' : 'pointer',
                  opacity: (isRevealed && !isCorrect && !isSelected) ? 0.6 : 1
                }}
              >
                <span>{opcion.texto}</span>
                {isRevealed && isCorrect && <CheckCircle2 size={20} color="#10b981" />}
                {isRevealed && isSelected && !isCorrect && <XCircle size={20} color="#ef4444" />}
                {!isRevealed && isSelected && <CheckCircle2 size={20} color="var(--primary-color)" />}
              </button>
            );
          })}
        </div>

        {revealed[currentIndex] ? (
          <div className="fade-in" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', borderLeft: '4px solid var(--primary-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
              <Info size={20} />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Explicación</h3>
            </div>
            <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>{currentQuestion.explicación}</p>
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn-option fade-in"
              onClick={handleReveal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}
            >
              <Eye size={16} /> Ver respuesta y explicación
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            className="btn-option" 
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentIndex === 0 ? 0.5 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={18} /> Anterior
          </button>

          {currentIndex < activeTest.preguntas.length - 1 ? (
            <button 
              className="btn-primary" 
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleNext}
            >
              Siguiente <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              className="btn-primary" 
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              onClick={handleFinish}
            >
              Finalizar Test <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecuteTest;
