'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { cadastrarAluno } from './actions';

type Turma = { id: string; nome: string; turno: string | null };

export function EntrarForm({ turmas, inicial }: { turmas: Turma[]; inicial: 'entrar' | 'criar' }) {
  const [modo, setModo] = useState(inicial);
  const [erro, setErro] = useState(''); const [ocupado, setOcupado] = useState(false); const [enviado, setEnviado] = useState(false);
  const router = useRouter();

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErro(''); setOcupado(true);
    const f = new FormData(e.currentTarget); const db = supabaseBrowser();
    const email = String(f.get('email')).trim(), senha = String(f.get('senha'));
    if (modo === 'entrar') {
      const { error } = await db.auth.signInWithPassword({ email, password: senha });
      if (error) { setErro('E-mail ou senha incorretos.'); setOcupado(false); return; }
      router.replace('/painel'); router.refresh(); return;
    }
    const res = await cadastrarAluno({
  nome: String(f.get('nome')),
  matricula: String(f.get('matricula')),
  turma: String(f.get('turma')),
  email,
  senha,
});
setOcupado(false);
if ('erro' in res) { setErro(res.erro); return; }
setEnviado(true);
  }

  return (
    <div className="login full-bleed">
      <div className="lform">
        <Link href="/" className="btn sm ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0 }}><Icon n="left" s={14} /> Voltar ao início</Link>
        <div className="row"><Logo /><div><b style={{ fontWeight: 600 }}>EduConecta</b><div className="sub" style={{ fontSize: 13 }}>Esquenta pro ENEM</div></div></div>
        {enviado ? (
          <>
            <h1 className="h1">Cadastro enviado</h1>
            <p className="note">Pronto! Se a plataforma pedir, confirme seu e-mail pelo link que enviamos. Depois, a gestão da escola precisa aprovar o seu acesso.</p>
            <button className="btn" onClick={() => { setEnviado(false); setModo('entrar'); }}>Ir para o login</button>
          </>
        ) : (
          <>
            <h1 className="h1">{modo === 'entrar' ? 'Entrar na plataforma' : 'Criar conta de aluno'}</h1>
            <form className="form" onSubmit={enviar} style={modo === 'entrar' ? { gridTemplateColumns: '1fr' } : undefined}>
              {modo === 'criar' && <>
                <div className="field full"><label htmlFor="nome">Nome completo</label><input className="inp" id="nome" name="nome" required minLength={3} autoComplete="name" /></div>
                <div className="field"><label htmlFor="matricula">Matrícula</label><input className="inp" id="matricula" name="matricula" required /></div>
                <div className="field"><label htmlFor="turma">Turma</label>
                  <select className="inp" id="turma" name="turma" required defaultValue="">
                    <option value="" disabled>Escolha</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}{t.turno ? ` · ${t.turno}` : ''}</option>)}
                  </select></div>
              </>}
              <div className={`field${modo === 'criar' ? ' full' : ''}`}><label htmlFor="email">E-mail</label><input className="inp" id="email" name="email" type="email" required autoComplete="email" /></div>
              <div className={`field${modo === 'criar' ? ' full' : ''}`}><label htmlFor="senha">Senha</label><input className="inp" id="senha" name="senha" type="password" required minLength={8} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} /></div>
              {modo === 'criar' && <p className="note full">Seu cadastro fica pendente até a gestão da escola aprovar. Professores recebem o acesso direto da gestão.</p>}
              {erro && <p className="erro full" role="alert">{erro}</p>}
              <div className="full row"><button className="btn pri lg" type="submit" disabled={ocupado}>{ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Enviar cadastro'}</button></div>
              {modo === 'entrar' && <div className="full"><Link href="/recuperar" className="btn sm ghost" style={{ paddingLeft: 0 }}>Esqueci a senha</Link></div>}
            </form>
            <button className="btn ghost" onClick={() => { setErro(''); setModo(modo === 'entrar' ? 'criar' : 'entrar'); }} style={{ alignSelf: 'flex-start' }}>
              {modo === 'entrar' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
            </button>
          </>
        )}
      </div>
      <div className="lart">
        <div className="hwave" aria-hidden="true">{Array.from({ length: 70 }, (_, k) => <i key={k} style={{ ['--c' as any]: k % 14, ['--r' as any]: Math.floor(k / 14) }} />)}</div>
        <h2>Trilhas, simulados e apostilas para estudar no seu ritmo.</h2>
        <p>Humanas, linguagens, matemática, natureza e redação em um só lugar, com acompanhamento do professor.</p>
      </div>
    </div>
  );
}
