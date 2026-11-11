import type { ItemMenu } from '@/components/Shell';
import type { Papel } from './tipos';

export function menuDe(papel: Papel, pendentes = { duvidas: 0, redacoes: 0, cadastros: 0 }): { menu: ItemMenu[]; extra: ItemMenu[] } {
  if (papel === 'aluno') {
    return {
      menu: [
        { href: '/aluno', label: 'Hoje', icon: 'home', exato: true },
        { href: '/aluno/trilhas', label: 'Trilhas', icon: 'route' },
        { href: '/aluno/simulados', label: 'Simulados', icon: 'exam' },
        { href: '/aluno/redacao', label: 'Redação', icon: 'file' },
        { href: '/aluno/duvidas', label: 'Dúvidas', icon: 'chat' },
        { href: '/aluno/biblioteca', label: 'Biblioteca', icon: 'book', mobile: false },
      ],
      extra: [{ href: '/aluno/biblioteca', label: 'Biblioteca', icon: 'book' }, { href: '/aluno/foco', label: 'Bloco de foco', icon: 'timer' }],
    };
  }
  const equipe: ItemMenu[] = [
    { href: papel === 'gestao' ? '/gestao' : '/professor', label: papel === 'gestao' ? 'Escola' : 'Turmas', icon: 'home', exato: true },
    ...(papel === 'gestao' ? [{ href: '/gestao/cadastros', label: 'Cadastros', icon: 'school', badge: pendentes.cadastros }, { href: '/gestao/turmas', label: 'Turmas e equipe', icon: 'users' }] : []),
    { href: '/professor/conteudo', label: 'Conteúdo', icon: 'folder', mobile: papel !== 'gestao' },
    { href: '/professor/banco', label: 'Questões', icon: 'bank', mobile: papel !== 'gestao' },
    { href: '/professor/redacoes', label: 'Redações', icon: 'file', badge: pendentes.redacoes },
    { href: '/professor/duvidas', label: 'Dúvidas', icon: 'chat', badge: pendentes.duvidas },
  ];
  if (papel === 'professor') return { menu: equipe, extra: [] };
  return { menu: equipe, extra: [{ href: '/professor', label: 'Acompanhar turmas', icon: 'users' }, { href: '/professor/conteudo', label: 'Conteúdo', icon: 'folder' }, { href: '/professor/banco', label: 'Questões', icon: 'bank' }] };
}
