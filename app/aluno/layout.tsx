import { exigirPerfil } from '@/lib/sessao';
import { menuDe } from '@/lib/menus';
import { Shell } from '@/components/Shell';

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const { perfil } = await exigirPerfil('aluno');
  const { menu, extra } = menuDe('aluno');
  return <Shell menu={menu} extra={extra} nome={perfil.nome} papel="Aluno">{children}</Shell>;
}
