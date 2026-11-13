import { redirect } from 'next/navigation';
import { Form } from '@/components/Form';
import { Logo } from '@/components/Logo';
import { supabaseServer } from '@/lib/supabase/server';
import { redefinirSenha } from '@/lib/acoes/senha';

export const dynamic = 'force-dynamic';
// Primeiro acesso: quem entrou com senha provisória precisa criar a própria senha.
export default async function TrocarSenha() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/entrar');
  if (!user.app_metadata?.trocar_senha) redirect('/painel');
  return (
    <div className="login full-bleed"><div className="lform">
      <div className="row"><Logo /><div><b style={{ fontWeight: 600 }}>EduConecta</b><div className="sub" style={{ fontSize: 13 }}>Esquenta pro ENEM</div></div></div>
      <h1 className="h1">Crie a sua senha</h1>
      <p className="sub">Você entrou com uma senha provisória. Escolha uma senha só sua para continuar.</p>
      <Form action={redefinirSenha} botao="Salvar e entrar">
        <div className="field full"><label htmlFor="ns">Nova senha (8+ caracteres)</label><input className="inp" id="ns" name="senha" type="password" required minLength={8} autoComplete="new-password" /></div>
        <div className="field full"><label htmlFor="nc">Repita a senha</label><input className="inp" id="nc" name="conf" type="password" required minLength={8} autoComplete="new-password" /></div>
      </Form>
    </div></div>
  );
}
