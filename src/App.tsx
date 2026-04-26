import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SelectTest from './pages/SelectTest';
import ExecuteTest from './pages/ExecuteTest';
import Results from './pages/Results';
import Statistics from './pages/Statistics';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="select" element={<SelectTest />} />
          <Route path="execute" element={<ExecuteTest />} />
          <Route path="results" element={<Results />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
