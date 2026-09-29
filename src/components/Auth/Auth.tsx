import {
  useState
} from 'react';

import {
  supabase
} from '../../lib/supabase';

import './Auth.css';

type ModoAuth =
  | 'entrar'
  | 'cadastrar'
  | 'recuperar';

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

type AuthProps = {
  recuperandoSenha?: boolean;
  onSenhaAtualizada?: () => void;
};

function Auth({
  recuperandoSenha = false,
  onSenhaAtualizada
}: AuthProps) {
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
    novaSenha,
    setNovaSenha
  ] =
    useState('');

  const [
    confirmarNovaSenha,
    setConfirmarNovaSenha
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

  async function entrarComGoogle() {
    limparAvisos();

    setCarregando(true);

    const {
      error
    } =
      await supabase.auth
        .signInWithOAuth({
          provider:
            'google',

          options: {
            redirectTo:
              `${window.location.origin}/`
          }
        });

    if (
      error
    ) {
      setCarregando(false);

      setErro(
        'Não foi possível continuar com o Google. Tente novamente.'
      );
    }
  }

  async function enviarRecuperacao(
    evento:
      React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    limparAvisos();

    if (
      !email.trim()
    ) {
      setErro(
        'Digite seu e-mail.'
      );

      return;
    }

    setCarregando(true);

    const {
      error
    } =
      await supabase.auth
        .resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${window.location.origin}/`
          }
        );

    setCarregando(false);

    if (
      error
    ) {
      setErro(
        'Não foi possível enviar o e-mail de recuperação. Confira o endereço e tente novamente.'
      );

      return;
    }

    setMensagem(
      'Pronto! Enviamos um link para redefinir sua senha. Confira também a caixa de spam.'
    );
  }

  async function atualizarSenha(
    evento:
      React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    limparAvisos();

    if (
      novaSenha.length < 6
    ) {
      setErro(
        'A nova senha precisa ter pelo menos 6 caracteres.'
      );

      return;
    }

    if (
      novaSenha !==
      confirmarNovaSenha
    ) {
      setErro(
        'As novas senhas não são iguais.'
      );

      return;
    }

    setCarregando(true);

    const {
      error
    } =
      await supabase.auth
        .updateUser({
          password:
            novaSenha
        });

    setCarregando(false);

    if (
      error
    ) {
      const mensagemErro =
        error.message
          .toLowerCase();

      const senhaIgual =
        mensagemErro.includes(
          'same password'
        )
        ||
        mensagemErro.includes(
          'different from the old password'
        )
        ||
        mensagemErro.includes(
          'new password should be different'
        );

      setErro(
        senhaIgual
          ? 'A nova senha precisa ser diferente da senha atual.'
          : 'Não foi possível atualizar a senha. Peça um novo link de recuperação e tente novamente.'
      );

      return;
    }

    window.alert(
      'Senha atualizada com sucesso!'
    );

    onSenhaAtualizada?.();
  }

  if (
    recuperandoSenha
  ) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <div className="auth-marca">
            <div className="auth-avatar">
              🔑
            </div>

            <div>
              <h1>
                Nova senha
              </h1>

              <p>
                Escolha uma nova senha para sua conta.
              </p>
            </div>
          </div>

          <form
            className="auth-form"
            onSubmit={
              atualizarSenha
            }
          >
            <div className="campo">
              <label>
                Nova senha
              </label>

              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={
                  novaSenha
                }
                onChange={(
                  evento
                ) =>
                  setNovaSenha(
                    evento.target.value
                  )
                }
              />
            </div>

            <div className="campo">
              <label>
                Confirmar nova senha
              </label>

              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={
                  confirmarNovaSenha
                }
                onChange={(
                  evento
                ) =>
                  setConfirmarNovaSenha(
                    evento.target.value
                  )
                }
              />
            </div>

            {erro && (
              <div className="auth-alerta erro">
                {erro}
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
                ? 'Salvando...'
                : 'Salvar nova senha'
              }
            </button>
          </form>

          <p className="auth-seguranca">
            🔒 Sua nova senha será protegida pelo Supabase.
          </p>
        </section>
      </div>
    );
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
              Controle Financeiro
            </h1>

            <p>
              Seu dinheiro, do seu jeito.
            </p>
          </div>
        </div>

        {modo !== 'recuperar' && (
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
        )}

        {modo === 'recuperar' && (
          <div className="auth-recuperar-topo">
            <button
              type="button"
              className="auth-voltar"
              onClick={() =>
                trocarModo(
                  'entrar'
                )
              }
            >
              ← Voltar para entrar
            </button>

            <h2>
              Esqueci minha senha
            </h2>

            <p>
              Digite seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={
            modo === 'entrar'
              ? entrar
              : modo === 'cadastrar'
                ? cadastrar
                : enviarRecuperacao
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

          {modo !== 'recuperar' && (
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
          )}

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

          {modo === 'entrar' && (
            <div className="auth-login-opcoes">
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

              <button
                type="button"
                className="auth-esqueceu"
                onClick={() =>
                  trocarModo(
                    'recuperar'
                  )
                }
              >
                Esqueci minha senha
              </button>
            </div>
          )}

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
                : modo === 'cadastrar'
                  ? 'Criar minha conta'
                  : 'Enviar link de recuperação'
            }
          </button>
        </form>

        {modo !== 'recuperar' && (
          <>
            <div className="auth-ou">
              <span>
                ou
              </span>
            </div>

            <button
              type="button"
              className="auth-google"
              onClick={
                entrarComGoogle
              }
              disabled={
                carregando
              }
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="auth-google-icone"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
                />
              </svg>

              <span>
                Continuar com Google
              </span>
            </button>
          </>
        )}

        <p className="auth-seguranca">
          🔒 Sua senha não é salva pelo app.
        </p>
      </section>
    </div>
  );
}

export default Auth;
