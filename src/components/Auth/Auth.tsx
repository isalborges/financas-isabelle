import {
  useState
} from 'react';

import {
  supabase
} from '../../lib/supabase';

import './Auth.css';

type ModoAuth =
  | 'entrar'
  | 'cadastrar';

type AvatarTipo =
  | 'tubarao'
  | 'macaco'
  | 'gato'
  | 'cachorro'
  | 'panda';

const AVATARES: {
  id: AvatarTipo;
  emoji: string;
  nome: string;
}[] = [
  {
    id: 'tubarao',
    emoji: '🦈',
    nome: 'Tubarão'
  },
  {
    id: 'macaco',
    emoji: '🐵',
    nome: 'Macaco'
  },
  {
    id: 'gato',
    emoji: '🐱',
    nome: 'Gato'
  },
  {
    id: 'cachorro',
    emoji: '🐶',
    nome: 'Cachorro'
  },
  {
    id: 'panda',
    emoji: '🐼',
    nome: 'Panda'
  }
];

const CHAVE_EMAIL =
  'financas-isabelle-email-lembrado';

function Auth() {
  const emailSalvo =
    localStorage.getItem(
      CHAVE_EMAIL
    ) ?? '';

  const [
    modo,
    setModo
  ] =
    useState<ModoAuth>(
      'entrar'
    );

  const [
    nome,
    setNome
  ] =
    useState('');

  const [
    avatarTipo,
    setAvatarTipo
  ] =
    useState<AvatarTipo>(
      'tubarao'
    );

  const [
    email,
    setEmail
  ] =
    useState(
      emailSalvo
    );

  const [
    senha,
    setSenha
  ] =
    useState('');

  const [
    confirmarSenha,
    setConfirmarSenha
  ] =
    useState('');

  const [
    lembrarEmail,
    setLembrarEmail
  ] =
    useState(
      Boolean(
        emailSalvo
      )
    );

  const [
    carregando,
    setCarregando
  ] =
    useState(false);

  const [
    erro,
    setErro
  ] =
    useState('');

  const [
    mensagem,
    setMensagem
  ] =
    useState('');

  function limparAvisos() {
    setErro('');
    setMensagem('');
  }

  function trocarModo(
    novoModo: ModoAuth
  ) {
    limparAvisos();

    setModo(
      novoModo
    );

    setSenha('');
    setConfirmarSenha('');
  }

  function salvarEmailLembrado() {
    if (
      lembrarEmail
    ) {
      localStorage.setItem(
        CHAVE_EMAIL,
        email.trim()
      );

      return;
    }

    localStorage.removeItem(
      CHAVE_EMAIL
    );
  }

  async function entrar(
    evento:
      React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    limparAvisos();

    if (
      !email.trim() ||
      !senha
    ) {
      setErro(
        'Preencha o e-mail e a senha.'
      );

      return;
    }

    setCarregando(true);

    const {
      error
    } =
      await supabase.auth
        .signInWithPassword({
          email:
            email.trim(),
          password:
            senha
        });

    setCarregando(false);

    if (
      error
    ) {
      setErro(
        'Não foi possível entrar. Confira o e-mail e a senha.'
      );

      return;
    }

    salvarEmailLembrado();
  }

  async function cadastrar(
    evento:
      React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    limparAvisos();

    if (
      !nome.trim()
    ) {
      setErro(
        'Digite seu nome.'
      );

      return;
    }

    if (
      !email.trim()
    ) {
      setErro(
        'Digite seu e-mail.'
      );

      return;
    }

    if (
      senha.length < 6
    ) {
      setErro(
        'A senha precisa ter pelo menos 6 caracteres.'
      );

      return;
    }

    if (
      senha !==
      confirmarSenha
    ) {
      setErro(
        'As senhas não são iguais.'
      );

      return;
    }

    setCarregando(true);

    const {
      data,
      error
    } =
      await supabase.auth
        .signUp({
          email:
            email.trim(),

          password:
            senha,

          options: {
            data: {
              nome:
                nome.trim(),
              avatar_tipo:
                avatarTipo
            }
          }
        });

    setCarregando(false);

    if (
      error
    ) {
      setErro(
        error.message
      );

      return;
    }

    salvarEmailLembrado();

    if (
      data.session
    ) {
      return;
    }

    setMensagem(
      'Conta criada! Confira seu e-mail para confirmar o cadastro antes de entrar.'
    );

    setModo(
      'entrar'
    );

    setSenha('');
    setConfirmarSenha('');
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-marca">
          <div className="auth-avatar">
            {modo === 'cadastrar'
              ? AVATARES.find(
                  (avatar) =>
                    avatar.id ===
                    avatarTipo
                )?.emoji
              : '🦈'
            }
          </div>

          <div>
            <h1>
              Finanças
            </h1>

            <p>
              Seu dinheiro, do seu jeito.
            </p>
          </div>
        </div>

        <div className="auth-abas">
          <button
            type="button"
            className={
              modo === 'entrar'
                ? 'active'
                : ''
            }
            onClick={() =>
              trocarModo(
                'entrar'
              )
            }
          >
            Entrar
          </button>

          <button
            type="button"
            className={
              modo === 'cadastrar'
                ? 'active'
                : ''
            }
            onClick={() =>
              trocarModo(
                'cadastrar'
              )
            }
          >
            Criar conta
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={
            modo === 'entrar'
              ? entrar
              : cadastrar
          }
        >
          {modo ===
            'cadastrar' && (
            <>
              <div className="campo">
                <label>
                  Nome
                </label>

                <input
                  type="text"
                  placeholder="Como quer ser chamado?"
                  autoComplete="name"
                  value={nome}
                  onChange={(
                    evento
                  ) =>
                    setNome(
                      evento.target.value
                    )
                  }
                />
              </div>

              <div className="campo">
                <label>
                  Escolha seu avatar
                </label>

                <div className="auth-avatares">
                  {AVATARES.map(
                    (avatar) => (
                      <button
                        type="button"
                        key={avatar.id}
                        className={
                          avatarTipo ===
                          avatar.id
                            ? 'auth-avatar-opcao selecionado'
                            : 'auth-avatar-opcao'
                        }
                        title={avatar.nome}
                        onClick={() =>
                          setAvatarTipo(
                            avatar.id
                          )
                        }
                      >
                        <span>
                          {avatar.emoji}
                        </span>

                        <small>
                          {avatar.nome}
                        </small>
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}

          <div className="campo">
            <label>
              E-mail
            </label>

            <input
              type="email"
              placeholder="voce@email.com"
              autoComplete="email"
              value={email}
              onChange={(
                evento
              ) =>
                setEmail(
                  evento.target.value
                )
              }
            />
          </div>

          <div className="campo">
            <label>
              Senha
            </label>

            <input
              type="password"
              placeholder="••••••••"
              autoComplete={
                modo === 'entrar'
                  ? 'current-password'
                  : 'new-password'
              }
              value={senha}
              onChange={(
                evento
              ) =>
                setSenha(
                  evento.target.value
                )
              }
            />
          </div>

          {modo ===
            'cadastrar' && (
            <div className="campo">
              <label>
                Confirmar senha
              </label>

              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={
                  confirmarSenha
                }
                onChange={(
                  evento
                ) =>
                  setConfirmarSenha(
                    evento.target.value
                  )
                }
              />
            </div>
          )}

          <label className="auth-lembrar">
            <input
              type="checkbox"
              checked={
                lembrarEmail
              }
              onChange={(
                evento
              ) =>
                setLembrarEmail(
                  evento.target.checked
                )
              }
            />

            <span>
              Lembrar meu e-mail
            </span>
          </label>

          {erro && (
            <div className="auth-alerta erro">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="auth-alerta sucesso">
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={
              carregando
            }
          >
            {carregando
              ? 'Aguarde...'
              : modo === 'entrar'
                ? 'Entrar'
                : 'Criar minha conta'
            }
          </button>
        </form>

        <p className="auth-seguranca">
          🔒 Sua senha não é salva pelo app.
        </p>
      </section>
    </div>
  );
}

export default Auth;
