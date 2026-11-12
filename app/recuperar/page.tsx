import Link from 'next/link';
import { Form } from '@/components/Form';
import { Logo } from '@/components/Logo';
import { recuperarSenha } from '@/lib/acoes/senha';

export default async function Recuperar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="login full-bleed"><div className="lform">
      <div className="row"><Logo /><div><b style={{ fontWeight: 600 }}>EduConecta</b><div className="sub" style={{ fontSize: 13 }}>Esquenta pro ENEM</div></div></div>
      <h1 className="h1">Recuperar senha</h1>
      <p className="sub">Informe o e-mail do seu cadastro. Enviaremos um link para criar uma nova senha.</p>
      {sp.erro && <p className="erro" role="alert">O link expirou ou já foi usado. Peça um novo abaixo.</p>}
      <Form action={recuperarSenha} botao="Enviar link">
        <div className="field full"><label htmlFor="rec-email">E-mail</label><input className="inp" id="rec-email" name="email" type="email" required autoComplete="email" /></div>
      </Form>
      <Link href="/entrar" className="btn ghost" style={{ alignSelf: 'flex-start' }}>Voltar ao login</Link>
    </div></div>
  );
}
