import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { statsService } from '../services/statsService';
import type { Test, ActiveTest, ActiveQuestion } from '../models/types';
import { Upload, Play, Settings, CheckSquare, Square, TrendingDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';

// Función para mezclar arrays (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const SelectTest: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);

  // Estados para Test por Tema
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(10);

  // Estados para Test Global Aleatorio
  const [selectedGlobalTopics, setSelectedGlobalTopics] = useState<string[]>([]);
  const [globalNumQuestions, setGlobalNumQuestions] = useState<number>(20);
  const [showGlobalConfig, setShowGlobalConfig] = useState<boolean>(false);

  // Estados para Test de Refuerzo
  const [weakNumQuestions, setWeakNumQuestions] = useState<number>(15);
  const weakTopics = useMemo(() => statsService.getWeakTopics(), []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = () => {
    const storedTests = storageService.get<Test[]>('saved_tests') || [];

    // Cargar tests estáticos de la carpeta src/data dinámicamente
    const dataModules = import.meta.glob('../data/*.json', { eager: true });
    const staticTests: Test[] = [];

    for (const path in dataModules) {
      const module = dataModules[path] as any;
      const json = module.default || module;
      // Una comprobación rápida de que al menos tiene la estructura base antes de hacer el push
      if (json && typeof json === 'object' && json.tema && Array.isArray(json.preguntas)) {
        staticTests.push(json as Test);
      }
    }

    // Combinar evitando duplicados por tema (localStorage sobrescribe a los estáticos)
    const combinedMap = new Map<string, Test>();
    staticTests.forEach(t => combinedMap.set(t.tema, t));
    storedTests.forEach(t => combinedMap.set(t.tema, t));

    const combinedTests = Array.from(combinedMap.values());

    setTests(combinedTests);
    // Seleccionar todos los temas por defecto para el test global
    setSelectedGlobalTopics(combinedTests.map(t => t.tema));
  };

  const validateTest = (data: any): data is Test => {
    if (!data.tema || typeof data.tema !== 'string') return false;
    if (!Array.isArray(data.preguntas)) return false;

    for (const q of data.preguntas) {
      if (typeof q.numero !== 'number') return false;
      if (typeof q.enunciado !== 'string') return false;
      if (!q.opciones || typeof q.opciones !== 'object') return false;
      if (!q.opciones.a || !q.opciones.b || !q.opciones.c || !q.opciones.d) return false;
      if (typeof q.respuesta_correcta !== 'string') return false;
      if (typeof q.explicación !== 'string') return false;
    }
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (validateTest(json)) {
          saveTest(json);
        } else {
          alert('El archivo no tiene el formato de test válido.');
        }
      } catch (error) {
        alert('Error al leer el archivo JSON.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const saveTest = (newTest: Test) => {
    let currentTests = storageService.get<Test[]>('saved_tests') || [];

    const existingIndex = currentTests.findIndex(t => t.tema === newTest.tema);
    if (existingIndex >= 0) {
      if (!window.confirm(`El tema "${newTest.tema}" ya existe. ¿Deseas sobrescribirlo?`)) {
        return;
      }
      currentTests[existingIndex] = newTest;
    } else {
      currentTests.push(newTest);
    }

    storageService.set('saved_tests', currentTests);
    setTests(currentTests);
    setSelectedGlobalTopics(prev => prev.includes(newTest.tema) ? prev : [...prev, newTest.tema]);
    alert(`Test "${newTest.tema}" cargado correctamente.`);
  };

  // ----- LÓGICA PARA TEST ESPECÍFICO -----
  const handleSelectClick = (index: number, maxQuestions: number) => {
    setSelectedTestIndex(index);
    setNumQuestions(Math.min(10, maxQuestions));
  };

  const generateSpecificTest = (test: Test) => {
    if (numQuestions < 1 || numQuestions > test.preguntas.length) {
      alert(`Selecciona un número válido de preguntas (1 - ${test.preguntas.length})`);
      return;
    }
    createAndNavigateTest(test.tema, test.preguntas, numQuestions, 'tema', [test.tema]);
  };

  // ----- LÓGICA PARA TEST GLOBAL ALEATORIO -----
  const globalQuestionsAvailable = useMemo(() => {
    return tests
      .filter(t => selectedGlobalTopics.includes(t.tema))
      .reduce((acc, test) => acc + test.preguntas.length, 0);
  }, [tests, selectedGlobalTopics]);

  const toggleGlobalTopic = (tema: string) => {
    setSelectedGlobalTopics(prev =>
      prev.includes(tema) ? prev.filter(t => t !== tema) : [...prev, tema]
    );
  };

  const toggleAllGlobalTopics = () => {
    if (selectedGlobalTopics.length === tests.length) {
      setSelectedGlobalTopics([]);
    } else {
      setSelectedGlobalTopics(tests.map(t => t.tema));
    }
  };

  const generateGlobalTest = () => {
    if (selectedGlobalTopics.length === 0) {
      alert("Selecciona al menos un tema.");
      return;
    }
    if (globalNumQuestions < 1 || globalNumQuestions > globalQuestionsAvailable) {
      alert(`Selecciona un número válido de preguntas (1 - ${globalQuestionsAvailable})`);
      return;
    }

    const allSelectedQuestions = tests
      .filter(t => selectedGlobalTopics.includes(t.tema))
      .flatMap(t => t.preguntas.map(q => ({ ...q, tema: t.tema }))); // Asegurar que tengan el tema

    createAndNavigateTest("Test Global Aleatorio", allSelectedQuestions, globalNumQuestions, 'aleatorio', selectedGlobalTopics);
  };

  // ----- LÓGICA PARA TEST DE REFUERZO -----
  const weakQuestionsAvailable = useMemo(() => {
    if (weakTopics.length === 0) return 0;
    const weakThemeNames = weakTopics.map(t => t.tema);
    return tests
      .filter(t => weakThemeNames.includes(t.tema))
      .reduce((acc, test) => acc + test.preguntas.length, 0);
  }, [tests, weakTopics]);

  const generateWeaknessTest = () => {
    if (weakQuestionsAvailable === 0) return;
    if (weakNumQuestions < 1 || weakNumQuestions > weakQuestionsAvailable) {
      alert(`Selecciona un número válido de preguntas (1 - ${weakQuestionsAvailable})`);
      return;
    }

    const weakThemeNames = weakTopics.map(t => t.tema);
    const allWeakQuestions = tests
      .filter(t => weakThemeNames.includes(t.tema))
      .flatMap(t => t.preguntas.map(q => ({ ...q, tema: t.tema })));

    createAndNavigateTest("Test de Refuerzo", allWeakQuestions, weakNumQuestions, 'aleatorio', weakThemeNames);
  };

  // ----- GENERADOR COMÚN -----
  const createAndNavigateTest = (title: string, questionsPool: any[], limit: number, tipoTest: 'tema' | 'aleatorio', temasIncluidos: string[]) => {
    const shuffledQuestions = shuffleArray(questionsPool);
    const selectedQuestions = shuffledQuestions.slice(0, limit);

    const activeQuestions: ActiveQuestion[] = selectedQuestions.map(q => {
      const keys = ['a', 'b', 'c', 'd'] as const;
      const shuffledKeys = shuffleArray([...keys]);

      const opcionesAleatorias = shuffledKeys.map(k => ({
        claveOriginal: k,
        texto: q.opciones[k]
      }));

      const { opciones, ...questionData } = q;
      return {
        ...questionData,
        opcionesAleatorias
      };
    });

    const activeTest: ActiveTest = {
      testId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      tema: title,
      tipoTest,
      temasIncluidos,
      preguntas: activeQuestions,
      respuestasUsuario: {},
      fechaInicio: new Date().toISOString()
    };

    storageService.set('active_test', activeTest);
    navigate('/execute');
  };

  const uploadAction = (<></>
    // <>
    //   <input
    //     type="file"
    //     accept=".json"
    //     ref={fileInputRef}
    //     style={{ display: 'none' }}
    //     onChange={handleFileUpload}
    //   />
    //   <button
    //     className="btn-primary row"
    //     onClick={() => fileInputRef.current?.click()}
    //   >
    //     <Upload size={18} /> Cargar JSON
    //   </button>
    // </>
  );

  return (
    <div className="page fade-in">
      <PageHeader
        title="Selección de Test"
        // subtitle="Elige un tema para empezar o carga uno nuevo"
        subtitle="Elige un tema para empezar"
        action={uploadAction}
      />

      {tests.length === 0 ? (
        <div className="card glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>No hay tests disponibles</h3>
          <p>Utiliza el botón de arriba para cargar un archivo JSON con preguntas.</p>
        </div>
      ) : (
        <>
          {/* SECCIÓN: TEST DE REFUERZO (Solo si hay debilidades) */}
          {weakTopics.length > 0 && weakQuestionsAvailable > 0 && (
            <div className="card glass-card fade-in" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderColor: '#ef4444', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <TrendingDown color="#ef4444" size={32} />
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: '#ef4444' }}>Test de Refuerzo</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Genera un test centrado únicamente en tus puntos débiles:</p>
                  <ul style={{ listStylePosition: 'inside', color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {weakTopics.map(t => (
                      <li key={t.tema}><strong>{t.tema}</strong> ({t.porcentajeAcierto.toFixed(1)}% acierto)</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Número de preguntas (Máximo: {weakQuestionsAvailable}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={weakQuestionsAvailable}
                    value={weakNumQuestions}
                    onChange={(e) => setWeakNumQuestions(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
                  />
                </div>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  onClick={generateWeaknessTest}
                >
                  <Play size={18} /> Iniciar Test de Refuerzo
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN: TEST GLOBAL */}
          <div className="card glass-card" style={{ marginBottom: '3rem', padding: '1.5rem', borderColor: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowGlobalConfig(!showGlobalConfig)}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--primary-color)' }}>Test Global Aleatorio</h2>
                <p style={{ color: 'var(--text-muted)' }}>Mezcla preguntas de varios temas para un repaso general.</p>
              </div>
              <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                {showGlobalConfig ? 'Ocultar' : 'Configurar'}
              </button>
            </div>

            {showGlobalConfig && (
              <div className="fade-in" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Selecciona Temas a incluir</h3>
                    <button
                      onClick={toggleAllGlobalTopics}
                      className="btn-option"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {selectedGlobalTopics.length === tests.length ? <CheckSquare size={16} /> : <Square size={16} />}
                      Todos
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.8rem' }}>
                    {tests.map(test => {
                      const isSelected = selectedGlobalTopics.includes(test.tema);
                      return (
                        <div
                          key={test.tema}
                          onClick={() => toggleGlobalTopic(test.tema)}
                          style={{
                            padding: '0.8rem',
                            background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isSelected ? 'var(--primary-color)' : 'transparent'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isSelected ? <CheckSquare size={18} color="var(--primary-color)" /> : <Square size={18} color="var(--text-muted)" />}
                          <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {test.tema}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Número de preguntas (Máximo: {globalQuestionsAvailable}):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={globalQuestionsAvailable}
                      value={globalNumQuestions}
                      onChange={(e) => setGlobalNumQuestions(parseInt(e.target.value) || 1)}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '1rem' }}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    onClick={generateGlobalTest}
                  >
                    <Play size={18} /> Iniciar Test Global
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: TEST POR TEMAS */}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Test por Temas Individuales</h2>
          <div className="test-grid">
            {tests.map((test, index) => {
              const isSelected = selectedTestIndex === index;
              return (
                <div key={index} className={`card interactive-card ${isSelected ? 'selected' : ''}`} style={isSelected ? { borderColor: 'var(--primary-color)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' } : {}}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{test.tema}</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    {test.preguntas.length} Preguntas Totales
                  </p>

                  {isSelected ? (
                    <div className="config-form fade-in" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          Número de preguntas:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={test.preguntas.length}
                          value={numQuestions}
                          onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-primary"
                          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                          onClick={() => generateSpecificTest(test)}
                        >
                          <Play size={16} /> Iniciar
                        </button>
                        <button
                          className="btn-option"
                          style={{ padding: '0.8rem' }}
                          onClick={() => setSelectedTestIndex(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => handleSelectClick(index, test.preguntas.length)}
                    >
                      <Settings size={18} /> Configurar Test
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SelectTest;
