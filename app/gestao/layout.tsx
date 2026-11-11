import { exigirPerfil } from '@/lib/sessao';
import { menuDe } from '@/lib/menus';
import { Shell } from '@/components/Shell';

export default async function GestaoLayout({ children }: { children: React.ReactNode }) {
  const { perfil, db } = await exigirPerfil('gestao');
  const [d, r, c] = await Promise.all([
    db.from('duvidas').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    db.from('redacoes').select('id', { count: 'exact', head: true }).eq('status', 'enviada'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
  ]);
  const { menu, extra } = menuDe('gestao', { duvidas: d.count ?? 0, redacoes: r.count ?? 0, cadastros: c.count ?? 0 });
  return <Shell menu={menu} extra={extra} nome={perfil.nome} papel="Gestão">{children}</Shell>;
}
