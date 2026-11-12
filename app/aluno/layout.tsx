import { exigirPerfil } from '@/lib/sessao';
import { menuDe } from '@/lib/menus';
import { Shell } from '@/components/Shell';

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const { perfil, db } = await exigirPerfil('aluno');
  const { count } = await db.from('duvidas').select('id', { count: 'exact', head: true }).eq('aluno_id', perfil.id).eq('status', 'respondida').is('visto_em', null);
  const { menu, extra } = menuDe('aluno', { duvidas: count ?? 0, redacoes: 0, cadastros: 0 });
  return <Shell menu={menu} extra={extra} nome={perfil.nome} papel="Aluno">{children}</Shell>;
}
