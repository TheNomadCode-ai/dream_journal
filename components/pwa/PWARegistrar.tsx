'use client';
import { useEffect } from 'react';

export default function PWARegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    }).then(reg => {
      console.log('SW registered:', reg.scope);
    }).catch(err => {
      console.error('SW failed:', err);
    });
  }, []);

  return null;
}
