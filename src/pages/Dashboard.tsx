import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import type { TestResult } from '../models/types';
import { Play, TrendingUp, BookOpen, Clock, Trash2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const history = storageService.get<TestResult[]>('test_history') || [];

  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const totalTestsTaken = history.length;
    let totalQuestions = 0;
    let totalAciertos = 0;
    let notaAcumulada = 0;

    history.forEach(test => {
      notaAcumulada += test.notaSobre10;
      if (test.detalles && test.detalles.length > 0) {
        test.detalles.forEach(d => {
          totalQuestions++;
          if (d.estado === 'correcta') totalAciertos++;
        });
      } else {
        totalQuestions += test.totalPreguntas;
        totalAciertos += test.aciertos;
      }
    });

    return {
      totalTestsTaken,
      averageScore: (notaAcumulada / totalTestsTaken).toFixed(2),
      globalAccuracy: totalQuestions > 0 ? ((totalAciertos / totalQuestions) * 100).toFixed(1) : 0,
      lastActive: history[0]?.fecha // El primero es el más reciente (lo añadimos con unshift)
    };
  }, [history]);

  const handleResetData = () => {
    const isConfirmed = window.confirm(
      "¿Estás completamente seguro de que quieres borrar todos tus datos?\n\nEsto eliminará permanentemente:\n- Todos los temas cargados\n- Tu historial de resultados\n- Tus estadísticas globales\n\nEsta acción no se puede deshacer."
    );

    if (isConfirmed) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="page fade-in">
      <header className="page-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Bienvenido de nuevo
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>¿Listo para seguir practicando?</p>
        </div>
        <button 
          className="btn-option" 
          onClick={handleResetData}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          title="Borrar todos los datos y empezar de cero"
        >
          <Trash2 size={18} /> Resetear Datos
        </button>
      </header>
      
      <div className="dashboard-cards" style={{ marginBottom: '3rem' }}>
        <div className="card glass-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <BookOpen color="#8b5cf6" size={24} />
            <h3 style={{ margin: 0 }}>Tests Realizados</h3>
          </div>
          <p className="card-value" style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{stats?.totalTestsTaken ?? 0}</p>
        </div>

        <div className="card glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <TrendingUp color="#10b981" size={24} />
            <h3 style={{ margin: 0 }}>Nota Media</h3>
          </div>
          <p className="card-value" style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{stats?.averageScore ?? '0.00'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> / 10</span></p>
        </div>

        <div className="card glass-card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Clock color="var(--primary-color)" size={24} />
            <h3 style={{ margin: 0 }}>Última Actividad</h3>
          </div>
          <p className="card-value" style={{ fontSize: '1.5rem', margin: '1rem 0' }}>
            {stats?.lastActive ? new Date(stats.lastActive).toLocaleDateString() : '-'}
          </p>
        </div>
      </div>

      <div className="card interactive-card glass-card" style={{ textAlign: 'center', padding: '3rem', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))', borderColor: 'var(--primary-color)' }} onClick={() => navigate('/select')}>
        <Play size={48} color="var(--primary-color)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Empezar un nuevo Test</h2>
        <p style={{ color: 'var(--text-muted)' }}>Elige un tema específico o genera un examen global aleatorio.</p>
      </div>
    </div>
  );
};

export default Dashboard;
