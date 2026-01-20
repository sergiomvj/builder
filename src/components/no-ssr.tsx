// Componente para prevenir problemas de hidratação
'use client';

import { useEffect, useState } from 'react';

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que só renderiza os filhos no cliente para evitar problemas de hidratação
 * Útil para componentes que dependem de APIs do browser ou estado local
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook para verificar se o código está executando no cliente
 * Útil para condições que dependem de APIs do browser
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para delay de renderização para evitar problemas de hidratação
 * com componentes que fazem fetch de dados imediatamente
 */
export function useDelayedRender(delay: number = 100) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isReady;
}