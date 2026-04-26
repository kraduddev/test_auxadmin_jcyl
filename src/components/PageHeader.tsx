import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  gradient?: boolean;
}

/**
 * Componente de cabecera de página reutilizable.
 * Gestiona automáticamente el layout entre título/subtítulo y la acción opcional.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, gradient = false }) => {
  return (
    <header className="page-header page-header--row">
      <div className="page-header__text">
        <h1 className={gradient ? 'heading-gradient' : undefined}>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </header>
  );
};

export default PageHeader;
