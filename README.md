# 🎓 TestApp Pro (Preparación de Oposiciones)

Una aplicación web SPA (Single Page Application) diseñada específicamente para la práctica, evaluación y seguimiento de test de oposiciones o exámenes tipo test. Orientada a la maximización del aprendizaje mediante análisis de datos y la personalización de los repasos.

## ✨ Funcionalidades Principales

La aplicación está diseñada para cubrir todo el flujo de estudio, desde la realización del examen hasta la analítica de fortalezas y debilidades.

*   **📚 Gestión Dinámica de Tests:**
    *   Carga automática de archivos `.json` ubicados en el directorio `src/data`.
    *   Soporte para subir archivos `.json` personalizados directamente desde la interfaz, persistiendo en la memoria del navegador.
*   **🎲 Motor de Exámenes Altamente Configurable:**
    *   **Test por Temas:** Selecciona un tema específico y el número exacto de preguntas a realizar.
    *   **Test Global:** Combina preguntas de múltiples temas simultáneamente para un repaso general.
    *   **Test de Refuerzo (Inteligente):** La aplicación detecta automáticamente tus "puntos débiles" (temas con un porcentaje de acierto inferior al 60%) y te permite generar exámenes específicos sobre ellos.
    *   **Aleatorización Total (Fisher-Yates):** Tanto el orden de las preguntas como el orden de las 4 opciones de respuesta se mezclan aleatoriamente en cada intento para evitar la memorización visual.
*   **📝 Entorno de Ejecución Interactivo:**
    *   Navegación fluida entre preguntas con barra de progreso.
    *   **Modo Estudio Dinámico:** Posibilidad de revelar la respuesta correcta y leer la explicación del temario en tiempo real sin tener que esperar a terminar el test.
    *   Cálculo estricto de notas: Las respuestas correctas suman 1 punto y las incorrectas penalizan según el estándar habitual (-0.33 por fallo).
*   **📊 Analítica y Estadísticas Globales:**
    *   **Dashboard** principal con métricas de alto nivel (Tests realizados, nota media histórica).
    *   Sección de **Estadísticas Detalladas** que analiza pregunta a pregunta tu historial.
    *   Identificación visual (con barras de progreso y colores semánticos) de tu tema más dominado y tus puntos débiles a repasar.
*   **🧹 Gestión de Datos Privada:**
    *   Todo el historial, estadísticas y tests subidos se guardan de forma local y privada en tu navegador (`localStorage`).
    *   Botón de "Reset Completo" disponible para borrar los progresos y empezar de cero.

## 🛠️ Tecnologías y Dependencias

El proyecto se ha construido buscando el máximo rendimiento, sin necesidad de un backend externo para funcionar.

*   **Core:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/) (para un entorno de desarrollo extremadamente rápido y un bundle optimizado).
*   **Navegación:** `react-router-dom` (Gestión de rutas SPA sin recargas de página).
*   **Iconografía:** `lucide-react` (Conjunto de iconos vectoriales ligeros y escalables).
*   **Estilos y Diseño:** CSS3 nativo (Vanilla CSS) aplicando principios de diseño moderno, utilizando **Glassmorphism**, paletas de colores oscuras (Dark Theme) e interfaces responsivas fluidas. No se utilizan frameworks CSS adicionales.

## 📁 Estructura del Proyecto

```text
/src
 ├── /components        # Componentes reutilizables de UI (Layout, etc.)
 ├── /data              # Archivos .json con las preguntas por temas (se cargan automáticamente)
 ├── /models            # Interfaces y tipados de TypeScript (types.ts)
 ├── /pages             # Vistas principales de la aplicación
 │   ├── Dashboard.tsx    # Vista de inicio con resumen
 │   ├── SelectTest.tsx   # Configuración y generación de exámenes
 │   ├── ExecuteTest.tsx  # Entorno interactivo de resolución
 │   ├── Results.tsx      # Corrección detallada tras finalizar
 │   └── Statistics.tsx   # Analítica de rendimiento profundo
 ├── /services          # Lógica de negocio encapsulada
 │   ├── storageService.ts  # Capa de abstracción sobre localStorage
 │   └── statsService.ts    # Motor de cálculo de métricas y rendimiento
 ├── App.tsx            # Definición de las rutas del proyecto
 ├── index.css          # Sistema de diseño, tokens (variables) y componentes CSS
 └── main.tsx           # Punto de entrada de la aplicación React
```

## 🚀 Instalación y Despliegue

Sigue estos pasos para arrancar el entorno en tu máquina local:

1.  **Clona o descarga el repositorio.**
2.  **Instala las dependencias:**
    ```bash
    npm install
    ```
3.  **Inicia el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible típicamente en `http://localhost:5173`.

4.  **Generar versión para producción:**
    ```bash
    npm run build
    ```
    Esto generará los archivos optimizados dentro del directorio `/dist`, listos para ser desplegados en cualquier servidor web estático (GitHub Pages, Vercel, Netlify, Apache, etc.).
