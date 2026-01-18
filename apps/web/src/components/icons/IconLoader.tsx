'use client';

import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface IconLoaderProps {
  iconPath: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',   // 16px
  md: 'w-5 h-5',   // 20px
  lg: 'w-6 h-6',   // 24px
  xl: 'w-7 h-7',   // 28px
  '2xl': 'w-8 h-8', // 32px
};

// Кеш для загруженных SVG
const svgCache = new Map<string, string>();

export function IconLoader({ iconPath, size, className }: IconLoaderProps) {
  const [svgContent, setSvgContent] = useState<string | null>(
    svgCache.get(iconPath) || null
  );
  const [isLoading, setIsLoading] = useState(!svgCache.has(iconPath));
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!iconPath) return;
    
    // Проверяем кеш
    if (svgCache.has(iconPath)) {
      setSvgContent(svgCache.get(iconPath)!);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Загружаем SVG
    fetch(iconPath)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.text();
      })
      .then(text => {
        // Удаляем width и height из SVG, чтобы он масштабировался через className
        const processed = text
          .replace(/width="[^"]*"/g, '')
          .replace(/height="[^"]*"/g, '')
          .replace(/<svg([^>]*)>/, '<svg$1 class="w-full h-full">');
        
        // Кешируем
        svgCache.set(iconPath, processed);
        setSvgContent(processed);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(`Failed to load icon from "${iconPath}":`, err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [iconPath]);
  
  if (error) {
    // В dev режиме показываем ошибку
    if (process.env.NODE_ENV === 'development') {
      return (
        <span 
          className={cn(sizeClasses[size], 'inline-block border-2 border-red-500', className)}
          title={`Error: ${error}`}
          aria-hidden="true"
        >
          ⚠️
        </span>
      );
    }
    return null;
  }
  
  if (isLoading || !svgContent) {
    // Показываем placeholder во время загрузки
    return (
      <span 
        className={cn(sizeClasses[size], 'inline-block', className)}
        aria-hidden="true"
      />
    );
  }
  
  return (
    <span
      className={cn(sizeClasses[size], 'inline-block', className)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-hidden="true"
    />
  );
}
