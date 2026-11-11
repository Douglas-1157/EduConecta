'use client';
import { Icon } from '@/components/Icon';
import { alternarTema } from '@/components/Shell';
export const ThemeBtn = () => <button className="ib" onClick={alternarTema} aria-label="Alternar tema claro e escuro"><Icon n="sun" /></button>;
