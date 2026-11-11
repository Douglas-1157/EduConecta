import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { Logo } from '@/components/Logo';
import { SairBotao } from './SairBotao';

export const dynamic = 'force-dynamic';
export default async function Aguardando() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: p } = await db.from('profiles').select('status,nome').eq('id', user.id).single();
  if (p?.status === 'ativo') redirect('/painel');
  return (
    <div className="login full-bleed" style={{ gridTemplateColumns: '1fr' }}>
      <div className="lform" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="row"><Logo /><b>EduConecta</b></div>
        <h1 className="h1">{p?.status === 'recusado' ? 'Cadastro não aprovado' : 'Aguardando aprovação'}</h1>
        <p className="sub">{p?.status === 'recusado' ? 'A gestão da escola não aprovou este cadastro. Procure a coordenação para saber mais.' : `Olá${p?.nome ? ', ' + p.nome.split(' ')[0] : ''}! Seu cadastro foi recebido. Assim que a gestão da escola aprovar, o acesso é liberado. Volte aqui depois.`}</p>
        <SairBotao />
      </div>
    </div>
  );
}
