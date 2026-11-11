import { redirect } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { INICIO } from '@/lib/tipos';

export const dynamic = 'force-dynamic';
export default async function Painel() { const { perfil } = await exigirPerfil(); redirect(INICIO[perfil.papel]); }
