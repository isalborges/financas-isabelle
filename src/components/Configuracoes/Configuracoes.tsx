import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';

import {
  criarIdCaixinha
} from '../../configuracoesFinanceiras';

import type {
  ConfiguracoesFinanceiras
} from '../../configuracoesFinanceiras';

import {
  supabase
} from '../../lib/supabase';

import {
  confirmarAcao
} from '../../lib/feedback';

import './Configuracoes.css';

type PerfilUsuario = {
  nome: string | null;
  avatar_tipo: string | null;
  avatar_url: string | null;
  tema_cor: string | null;
  modo_tema: string | null;
};

export type ConfiguracoesHandle = {
  salvar: () => Promise<boolean>;
};

type ConfiguracoesProps = {
  onAlteracoesPendentes: (alteradas: boolean) => void;
  configuracoesSalvas:
    ConfiguracoesFinanceiras;
  onSalvarConfiguracoes:
    (
      configuracoes:
        ConfiguracoesFinanceiras
    ) => Promise<boolean>;
  userId: string;
  emailUsuario: string;
  provedoresLogin: string[];
  contaCriadaEm: string;
  nomeUsuario: string;
  avatarTipo: string;
  avatarUrl: string | null;
  temaCor: string;
  modoTema: string;
  onPerfilAtualizado: (
    perfil: PerfilUsuario
  ) => void;
};

const AVATARES = [
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

const CORES_TEMA = [
  {
    id: 'rosa',
    nome: 'Rosa',
    cor: '#d87598'
  },
  {
    id: 'azul',
    nome: 'Azul',
    cor: '#5b8def'
  },
  {
    id: 'verde',
    nome: 'Verde',
    cor: '#59a77d'
  },
  {
    id: 'roxo',
    nome: 'Roxo',
    cor: '#8b72d9'
  }
];

const MODOS_TEMA = [
  {
    id: 'claro',
    nome: 'Claro',
    icone: '☀️'
  },
  {
    id: 'escuro',
    nome: 'Escuro',
    icone: '🌙'
  },
  {
    id: 'sistema',
    nome: 'Sistema',
    icone: '💻'
  }
];

const FORMAS_PAGAMENTO_OBRIGATORIAS = [
  'PIX',
  'Crédito',
  'Débito'
];

const Configuracoes = forwardRef<
  ConfiguracoesHandle,
  ConfiguracoesProps
>(function Configuracoes({
  onAlteracoesPendentes,
  configuracoesSalvas,
  onSalvarConfiguracoes,
  userId,
  emailUsuario,
  provedoresLogin,
  contaCriadaEm,
  nomeUsuario,
  avatarTipo,
  avatarUrl,
  temaCor,
  modoTema,
  onPerfilAtualizado
}: ConfiguracoesProps, ref) {
  const [
    configuracoes,
    setConfiguracoes
  ] =
    useState<
      ConfiguracoesFinanceiras
    >(
      () =>
        JSON.parse(
          JSON.stringify(
            configuracoesSalvas
          )
        )
    );

  const [
    snapshotConfiguracoes,
    setSnapshotConfiguracoes
  ] =
    useState<
      ConfiguracoesFinanceiras
    >(
      () =>
        JSON.parse(
          JSON.stringify(
            configuracoesSalvas
          )
        )
    );

  const [
    nomePerfil,
    setNomePerfil
  ] =
    useState(
      nomeUsuario
    );

  const [
    avatarTipoPerfil,
    setAvatarTipoPerfil
  ] =
    useState(
      avatarTipo
    );

  const [
    avatarUrlPerfil,
    setAvatarUrlPerfil
  ] =
    useState<
      string | null
    >(
      avatarUrl
    );

  const [
    temaCorPerfil,
    setTemaCorPerfil
  ] =
    useState(
      temaCor
    );

  const [
    modoTemaPerfil,
    setModoTemaPerfil
  ] =
    useState(
      modoTema
    );

  const [
    fotoSelecionada,
    setFotoSelecionada
  ] =
    useState<
      File | null
    >(
      null
    );

  const [
    salvando,
    setSalvando
  ] =
    useState(false);

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
    salvandoSenha,
    setSalvandoSenha
  ] =
    useState(false);

  const [
    mensagemSeguranca,
    setMensagemSeguranca
  ] =
    useState('');

  const [
    erroSeguranca,
    setErroSeguranca
  ] =
    useState('');

  const usaGoogle =
    provedoresLogin.includes(
      'google'
    );

  const usaEmailSenha =
    provedoresLogin.includes(
      'email'
    );

  const dataCriacaoFormatada =
    contaCriadaEm
      ? new Intl.DateTimeFormat(
          'pt-BR',
          {
            dateStyle:
              'medium'
          }
        ).format(
          new Date(
            contaCriadaEm
          )
        )
      : 'Não disponível';

  const perfilSalvo = {
    nome:
      nomeUsuario,
    avatarTipo:
      avatarTipo,
    avatarUrl:
      avatarUrl,
    temaCor:
      temaCor,
    modoTema:
      modoTema
  };

  const [
    novaCategoria,
    setNovaCategoria
  ] = useState('');

  const [
    novaFormaPagamento,
    setNovaFormaPagamento
  ] = useState('');

  const [
    novaCaixinha,
    setNovaCaixinha
  ] = useState('');

  const [
    mensagem,
    setMensagem
  ] = useState('');

  const alteracoesFinanceirasPendentes =
    JSON.stringify(
      configuracoes
    ) !==
    JSON.stringify(
      snapshotConfiguracoes
    );

  const alteracoesPerfilPendentes =
    nomePerfil.trim() !==
      perfilSalvo.nome
    ||
    avatarTipoPerfil !==
      perfilSalvo.avatarTipo
    ||
    avatarUrlPerfil !==
      perfilSalvo.avatarUrl
    ||
    temaCorPerfil !==
      perfilSalvo.temaCor
    ||
    modoTemaPerfil !==
      perfilSalvo.modoTema
    ||
    fotoSelecionada !==
      null;

  const alteracoesPendentes =
    alteracoesFinanceirasPendentes
    ||
    alteracoesPerfilPendentes;

  useEffect(() => {
    const copia =
      JSON.parse(
        JSON.stringify(
          configuracoesSalvas
        )
      ) as ConfiguracoesFinanceiras;

    setConfiguracoes(
      copia
    );

    setSnapshotConfiguracoes(
      copia
    );
  }, [
    configuracoesSalvas
  ]);

  useEffect(() => {
    onAlteracoesPendentes(
      alteracoesPendentes
    );
  }, [
    alteracoesPendentes,
    onAlteracoesPendentes
  ]);

  useEffect(() => {
    document.documentElement
      .setAttribute(
        'data-theme-color',
        temaCorPerfil
      );

    document.documentElement
      .setAttribute(
        'data-theme-mode',
        modoTemaPerfil
      );
  }, [
    temaCorPerfil,
    modoTemaPerfil
  ]);

  useEffect(() => {
    function avisarAntesDeFechar(
      evento: BeforeUnloadEvent
    ) {
      if (
        !alteracoesPendentes
      ) {
        return;
      }

      evento.preventDefault();
    }

    window.addEventListener(
      'beforeunload',
      avisarAntesDeFechar
    );

    return () => {
      window.removeEventListener(
        'beforeunload',
        avisarAntesDeFechar
      );
    };
  }, [
    alteracoesPendentes
  ]);

  useEffect(() => {
    return () => {
      onAlteracoesPendentes(
        false
      );
    };
  }, [
    onAlteracoesPendentes
  ]);

  async function alterarSenha() {
    setMensagemSeguranca('');
    setErroSeguranca('');

    if (
      novaSenha.length <
      6
    ) {
      setErroSeguranca(
        'A nova senha precisa ter pelo menos 6 caracteres.'
      );

      return;
    }

    if (
      novaSenha !==
      confirmarNovaSenha
    ) {
      setErroSeguranca(
        'As senhas não são iguais.'
      );

      return;
    }

    setSalvandoSenha(
      true
    );

    const {
      error
    } =
      await supabase.auth
        .updateUser({
          password:
            novaSenha
        });

    setSalvandoSenha(
      false
    );

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

      setErroSeguranca(
        senhaIgual
          ? 'A nova senha precisa ser diferente da senha atual.'
          : 'Não foi possível alterar sua senha. Tente novamente.'
      );

      return;
    }

    setNovaSenha('');
    setConfirmarNovaSenha('');

    setMensagemSeguranca(
      'Senha alterada com sucesso.'
    );
  }

  async function salvar() {
    setSalvando(true);

    let novaAvatarUrl =
      avatarUrlPerfil;

    if (
      fotoSelecionada
    ) {
      if (
        fotoSelecionada.size >
        5 * 1024 * 1024
      ) {
        window.alert(
          'Escolha uma imagem de até 5 MB.'
        );

        setSalvando(false);
        return false;
      }

      const caminho =
        `${userId}/avatar`;

      const {
        error:
          uploadError
      } =
        await supabase.storage
          .from('avatars')
          .upload(
            caminho,
            fotoSelecionada,
            {
              upsert: true,
              contentType:
                fotoSelecionada.type
            }
          );

      if (
        uploadError
      ) {
        window.alert(
          `Não foi possível enviar a foto: ${uploadError.message}`
        );

        setSalvando(false);
        return false;
      }

      const {
        data:
          publicUrlData
      } =
        supabase.storage
          .from('avatars')
          .getPublicUrl(
            caminho
          );

      novaAvatarUrl =
        `${publicUrlData.publicUrl}?v=${Date.now()}`;
    }

    const {
      error:
        perfilError
    } =
      await supabase
        .from('profiles')
        .update({
          nome:
            nomePerfil.trim(),
          avatar_tipo:
            avatarTipoPerfil,
          avatar_url:
            novaAvatarUrl,
          tema_cor:
            temaCorPerfil,
          modo_tema:
            modoTemaPerfil
        })
        .eq(
          'id',
          userId
        );

    if (
      perfilError
    ) {
      window.alert(
        `Não foi possível salvar o perfil: ${perfilError.message}`
      );

      setSalvando(false);
      return false;
    }

    const configuracoesSalvasComSucesso =
      await onSalvarConfiguracoes(
        configuracoes
      );

    if (
      !configuracoesSalvasComSucesso
    ) {
      setSalvando(false);
      return false;
    }

    setSnapshotConfiguracoes(
      JSON.parse(
        JSON.stringify(
          configuracoes
        )
      )
    );

    setAvatarUrlPerfil(
      novaAvatarUrl
    );

    setFotoSelecionada(
      null
    );

    onPerfilAtualizado({
      nome:
        nomePerfil.trim(),
      avatar_tipo:
        avatarTipoPerfil,
      avatar_url:
        novaAvatarUrl,
      tema_cor:
        temaCorPerfil,
      modo_tema:
        modoTemaPerfil
    });

    onAlteracoesPendentes(
      false
    );

    setMensagem(
      'Configurações salvas com sucesso.'
    );

    setSalvando(false);

    window.setTimeout(() => {
      setMensagem('');
    }, 2500);

    return true;
  }

  useImperativeHandle(
    ref,
    () => ({
      salvar
    })
  );

  function adicionarCategoria() {
    const nome =
      novaCategoria.trim();

    if (!nome) {
      return;
    }

    const jaExiste =
      configuracoes.categorias.some(
        (categoria) =>
          categoria.toLowerCase() ===
          nome.toLowerCase()
      );

    if (jaExiste) {
      return;
    }

    setConfiguracoes({
      ...configuracoes,
      categorias: [
        ...configuracoes.categorias,
        nome
      ].sort(
        (
          categoriaA,
          categoriaB
        ) =>
          categoriaA.localeCompare(
            categoriaB,
            'pt-BR',
            {
              sensitivity: 'base'
            }
          )
      )
    });

    setNovaCategoria('');
  }

  function excluirCategoria(
    categoriaExcluir: string
  ) {
    if (
      categoriaExcluir ===
      'Salário'
    ) {
      window.alert(
        'A categoria Salário não pode ser excluída porque ela é usada nos cálculos do app.'
      );

      return;
    }

    setConfiguracoes({
      ...configuracoes,
      categorias:
        configuracoes.categorias.filter(
          (categoria) =>
            categoria !==
            categoriaExcluir
        )
    });
  }

  function adicionarFormaPagamento() {
    const nome =
      novaFormaPagamento.trim();

    if (!nome) {
      return;
    }

    const jaExiste =
      configuracoes.formasPagamento.some(
        (forma) =>
          forma.toLowerCase() ===
          nome.toLowerCase()
      );

    if (jaExiste) {
      return;
    }

    setConfiguracoes({
      ...configuracoes,
      formasPagamento: [
        ...configuracoes.formasPagamento,
        nome
      ].sort(
        (formaA, formaB) =>
          formaA.localeCompare(
            formaB,
            'pt-BR',
            {
              sensitivity: 'base'
            }
          )
      )
    });

    setNovaFormaPagamento('');
  }

  function excluirFormaPagamento(
    formaExcluir: string
  ) {
    if (
      FORMAS_PAGAMENTO_OBRIGATORIAS
        .includes(formaExcluir)
    ) {
      window.alert(
        'PIX, Crédito e Débito são formas de pagamento obrigatórias e não podem ser excluídas.'
      );

      return;
    }

    setConfiguracoes({
      ...configuracoes,
      formasPagamento:
        configuracoes.formasPagamento.filter(
          (forma) =>
            forma !== formaExcluir
        )
    });
  }

  function alterarPercentual(
    id: string,
    valor: string
  ) {
    const percentual =
      valor === ''
        ? null
        : Math.max(
            0,
            Math.min(
              Number(valor),
              100
            )
          );

    setConfiguracoes({
      ...configuracoes,
      caixinhas:
        configuracoes.caixinhas.map(
          (caixinha) =>
            caixinha.id === id
              ? {
                  ...caixinha,
                  percentualSalario:
                    percentual
                }
              : caixinha
        )
    });
  }

  function alterarNomeCaixinha(
    id: string,
    nome: string
  ) {
    setConfiguracoes({
      ...configuracoes,
      caixinhas:
        configuracoes.caixinhas.map(
          (caixinha) =>
            caixinha.id === id
              ? {
                  ...caixinha,
                  nome
                }
              : caixinha
        )
    });
  }

  function adicionarCaixinha() {
    const nome =
      novaCaixinha.trim();

    if (!nome) {
      return;
    }

    setConfiguracoes({
      ...configuracoes,
      caixinhas: [
        ...configuracoes.caixinhas,
        {
          id:
            criarIdCaixinha(nome),
          nome,
          percentualSalario:
            null,
          protegida:
            false
        }
      ]
    });

    setNovaCaixinha('');
  }

  async function excluirCaixinha(
    id: string
  ) {
    const caixinha =
      configuracoes.caixinhas.find(
        (item) =>
          item.id === id
      );

    if (!caixinha) {
      return;
    }

    if (caixinha.protegida) {
      window.alert(
        'As caixinhas protegidas não podem ser excluídas.'
      );

      return;
    }

    const confirmar =
      await confirmarAcao({
        titulo:
          'Excluir caixinha?',
        mensagem:
          `A caixinha "${caixinha.nome}" será removida das suas configurações.`,
        textoConfirmar:
          'Excluir',
        perigoso:
          true
      });

    if (!confirmar) {
      return;
    }

    setConfiguracoes({
      ...configuracoes,
      caixinhas:
        configuracoes.caixinhas.filter(
          (item) =>
            item.id !== id
        )
    });
  }

  return (
    <section className="page">
      <div className="config-aviso-importante">
        <div className="config-aviso-importante-icone">
          !
        </div>

        <div>
          <strong>
            Importante
          </strong>

          <p>
            As alterações feitas nesta página só entram em vigor depois que você clicar em “Salvar configurações” no final da página.
          </p>
        </div>
      </div>

      {mensagem && (
        <div className="config-sucesso-popup">
          <span className="config-sucesso-icone">
            ✓
          </span>

          <div>
            <strong>
              Tudo certo!
            </strong>

            <p>
              {mensagem}
            </p>
          </div>
        </div>
      )}

      <section
        className="card config-secao"
        id="config-perfil"
      >
        <div className="config-titulo">
          <div>
            <h2>
              Perfil
            </h2>

            <p>
              Escolha um avatar ou envie
              sua própria foto.
            </p>
          </div>
        </div>

        <div className="perfil-config-grid">
          <div className="perfil-preview-area">
            <div className="perfil-avatar-preview">
              {fotoSelecionada ? (
                <img
                  src={
                    URL.createObjectURL(
                      fotoSelecionada
                    )
                  }
                  alt="Prévia da foto"
                />
              ) : avatarUrlPerfil ? (
                <img
                  src={avatarUrlPerfil}
                  alt="Foto do perfil"
                />
              ) : (
                <span>
                  {AVATARES.find(
                    (avatar) =>
                      avatar.id ===
                      avatarTipoPerfil
                  )?.emoji ?? '🦈'}
                </span>
              )}
            </div>

            <label className="btn-secondary perfil-upload">
              Escolher foto

              <input
                type="file"
                accept="image/*"
                onChange={(evento) => {
                  const arquivo =
                    evento.target
                      .files?.[0];

                  if (
                    arquivo
                  ) {
                    setFotoSelecionada(
                      arquivo
                    );
                  }
                }}
              />
            </label>

            {(fotoSelecionada ||
              avatarUrlPerfil) && (
              <button
                type="button"
                className="perfil-remover-foto"
                onClick={() => {
                  setFotoSelecionada(
                    null
                  );

                  setAvatarUrlPerfil(
                    null
                  );
                }}
              >
                Usar avatar em vez da foto
              </button>
            )}
          </div>

          <div className="perfil-config-conteudo">
            <div className="campo">
              <label>
                Nome
              </label>

              <input
                type="text"
                value={
                  nomePerfil
                }
                onChange={(evento) =>
                  setNomePerfil(
                    evento.target.value
                  )
                }
              />
            </div>

            <div className="campo">
              <label>
                Avatar
              </label>

              <div className="perfil-avatares">
                {AVATARES.map(
                  (avatar) => (
                    <button
                      type="button"
                      key={avatar.id}
                      title={avatar.nome}
                      className={
                        avatarTipoPerfil ===
                        avatar.id
                          ? 'perfil-avatar-opcao selecionado'
                          : 'perfil-avatar-opcao'
                      }
                      onClick={() => {
                        setAvatarTipoPerfil(
                          avatar.id
                        );

                        setFotoSelecionada(
                          null
                        );

                        setAvatarUrlPerfil(
                          null
                        );
                      }}
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

            <small className="perfil-ajuda">
              Foto personalizada tem prioridade.
              Se remover a foto, o avatar escolhido
              volta a aparecer.
            </small>
          </div>
        </div>
      </section>

      <section
        className="card config-secao"
        id="config-conta"
      >
        <div className="config-titulo">
          <div>
            <h2>
              Conta
            </h2>

            <p>
              Veja seus dados de acesso e
              gerencie a segurança da conta.
            </p>
          </div>
        </div>

        <div className="conta-resumo-grid">
          <div className="conta-info-card">
            <span className="conta-info-rotulo">
              E-mail
            </span>

            <strong className="conta-info-valor">
              {emailUsuario}
            </strong>

            <small>
              Este é o e-mail usado para acessar sua conta.
            </small>
          </div>

          <div className="conta-info-card">
            <span className="conta-info-rotulo">
              Forma de acesso
            </span>

            <div className="conta-provedores">
              {usaGoogle && (
                <span className="conta-provedor google">
                  G Google
                </span>
              )}

              {usaEmailSenha && (
                <span className="conta-provedor email">
                  ✉ E-mail e senha
                </span>
              )}

              {!usaGoogle &&
                !usaEmailSenha && (
                  <span className="conta-provedor">
                    Conta autenticada
                  </span>
                )}
            </div>

            <small>
              Você pode continuar usando os métodos vinculados à sua conta.
            </small>
          </div>

          <div className="conta-info-card">
            <span className="conta-info-rotulo">
              Conta criada em
            </span>

            <strong className="conta-info-valor">
              {dataCriacaoFormatada}
            </strong>

            <small>
              Data de criação da sua conta no Controle Financeiro.
            </small>
          </div>
        </div>

        <div className="conta-seguranca">
          <div className="conta-seguranca-titulo">
            <div>
              <h3>
                Senha
              </h3>

              <p>
                {usaEmailSenha
                  ? 'Altere a senha usada para entrar com e-mail.'
                  : 'Sua conta está conectada pelo Google.'
                }
              </p>
            </div>
          </div>

          {usaEmailSenha ? (
            <div className="conta-senha-form">
              <div className="campo">
                <label>
                  Nova senha
                </label>

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo de 6 caracteres"
                  value={
                    novaSenha
                  }
                  onChange={(evento) =>
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
                  autoComplete="new-password"
                  placeholder="Digite novamente"
                  value={
                    confirmarNovaSenha
                  }
                  onChange={(evento) =>
                    setConfirmarNovaSenha(
                      evento.target.value
                    )
                  }
                />
              </div>

              <button
                type="button"
                className="btn-secondary conta-alterar-senha"
                onClick={
                  alterarSenha
                }
                disabled={
                  salvandoSenha
                }
              >
                {salvandoSenha
                  ? 'Alterando...'
                  : 'Alterar senha'
                }
              </button>
            </div>
          ) : (
            <div className="conta-google-aviso">
              <span>
                G
              </span>

              <div>
                <strong>
                  Senha gerenciada pelo Google
                </strong>

                <p>
                  Para alterar sua senha, use as configurações da sua Conta Google.
                </p>
              </div>
            </div>
          )}

          {mensagemSeguranca && (
            <div className="conta-mensagem sucesso">
              ✓ {mensagemSeguranca}
            </div>
          )}

          {erroSeguranca && (
            <div className="conta-mensagem erro">
              {erroSeguranca}
            </div>
          )}
        </div>
      </section>

      <section
        className="card config-secao"
        id="config-aparencia"
      >
        <div className="config-titulo">
          <div>
            <h2>
              Aparência
            </h2>

            <p>
              Escolha a cor e o modo
              visual do seu app.
            </p>
          </div>
        </div>

        <div className="aparencia-bloco">
          <div className="campo">
            <label>
              Cor do app
            </label>

            <div className="tema-cores">
              {CORES_TEMA.map(
                (corTema) => (
                  <button
                    type="button"
                    key={corTema.id}
                    className={
                      temaCorPerfil ===
                      corTema.id
                        ? 'tema-cor-opcao selecionado'
                        : 'tema-cor-opcao'
                    }
                    onClick={() =>
                      setTemaCorPerfil(
                        corTema.id
                      )
                    }
                  >
                    <span
                      className="tema-cor-bolinha"
                      style={{
                        background:
                          corTema.cor
                      }}
                    />

                    <span>
                      {corTema.nome}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="campo">
            <label>
              Aparência
            </label>

            <div className="tema-modos">
              {MODOS_TEMA.map(
                (modo) => (
                  <button
                    type="button"
                    key={modo.id}
                    className={
                      modoTemaPerfil ===
                      modo.id
                        ? 'tema-modo-opcao selecionado'
                        : 'tema-modo-opcao'
                    }
                    onClick={() =>
                      setModoTemaPerfil(
                        modo.id
                      )
                    }
                  >
                    <span>
                      {modo.icone}
                    </span>

                    <strong>
                      {modo.nome}
                    </strong>
                  </button>
                )
              )}
            </div>
          </div>

          <small className="perfil-ajuda">
            A alteração aparece na hora.
            Clique em Salvar configurações
            para manter a escolha na sua conta.
          </small>
        </div>
      </section>

      <section className="config-aviso">
        <strong>
          Importante
        </strong>

        <p>
          As alterações feitas nesta página
          só entram em vigor depois que você
          clicar em “Salvar configurações”
          no final da página.
        </p>
      </section>

      <section
        className="card config-secao"
        id="config-caixinhas"
      >
        <div className="config-titulo">
          <div>
            <h2>
              Caixinhas
            </h2>

            <p>
              Configure suas metas
              e crie novas caixinhas.
            </p>
          </div>
        </div>

        <div className="config-caixinhas">
          {configuracoes.caixinhas.map(
            (caixinha) => (
              <div
                className="config-caixinha"
                key={caixinha.id}
              >
                <div className="config-caixinha-campos">
                  <div className="campo">
                    <label>
                      Nome
                    </label>

                    <input
                      type="text"
                      value={caixinha.nome}
                      onChange={(evento) =>
                        alterarNomeCaixinha(
                          caixinha.id,
                          evento.target.value
                        )
                      }
                    />
                  </div>

                  <div className="campo">
                    <label>
                      Meta sobre o salário
                    </label>

                    <div className="config-percentual">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Sem meta"
                        value={
                          caixinha.percentualSalario ??
                          ''
                        }
                        onChange={(evento) =>
                          alterarPercentual(
                            caixinha.id,
                            evento.target.value
                          )
                        }
                      />

                      <span>
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="config-caixinha-rodape">
                  <span>
                    {caixinha.percentualSalario ===
                    null
                      ? 'Sem meta automática'
                      : `${caixinha.percentualSalario}% do salário`
                    }
                  </span>

                  {!caixinha.protegida && (
                    <button
                      className="config-excluir"
                      onClick={() =>
                        excluirCaixinha(
                          caixinha.id
                        )
                      }
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        <div className="config-adicionar">
          <div className="campo">
            <label>
              Nova caixinha
            </label>

            <input
              type="text"
              placeholder="Ex: Reserva de emergência"
              value={novaCaixinha}
              onChange={(evento) =>
                setNovaCaixinha(
                  evento.target.value
                )
              }
              onKeyDown={(evento) => {
                if (
                  evento.key ===
                  'Enter'
                ) {
                  adicionarCaixinha();
                }
              }}
            />
          </div>

          <button
            className="btn-secondary"
            onClick={
              adicionarCaixinha
            }
          >
            + Adicionar caixinha
          </button>
        </div>
      </section>

      <section
        className="card config-secao"
        id="config-formas-pagamento"
      >
        <div className="config-titulo">
          <div>
            <h2>
              Formas de pagamento
            </h2>

            <p>
              Personalize as opções disponíveis nos lançamentos.
              PIX, Crédito e Débito são obrigatórios.
            </p>
          </div>
        </div>

        <div className="config-categorias">
          {configuracoes.formasPagamento.map(
            (forma) => {
              const obrigatoria =
                FORMAS_PAGAMENTO_OBRIGATORIAS
                  .includes(forma);

              return (
                <div
                  className="config-categoria"
                  key={forma}
                >
                  <span>
                    {forma}
                    {obrigatoria && (
                      <small className="config-obrigatoria">
                        Obrigatório
                      </small>
                    )}
                  </span>

                  {!obrigatoria && (
                    <button
                      type="button"
                      onClick={() =>
                        excluirFormaPagamento(forma)
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            }
          )}
        </div>

        <div className="config-adicionar">
          <div className="campo">
            <label>
              Nova forma de pagamento
            </label>

            <input
              type="text"
              placeholder="Ex: Dinheiro, Boleto, Vale-refeição"
              value={novaFormaPagamento}
              onChange={(evento) =>
                setNovaFormaPagamento(
                  evento.target.value
                )
              }
              onKeyDown={(evento) => {
                if (
                  evento.key ===
                  'Enter'
                ) {
                  adicionarFormaPagamento();
                }
              }}
            />
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={
              adicionarFormaPagamento
            }
          >
            + Adicionar forma
          </button>
        </div>
      </section>

      <section
        className="card config-secao"
        id="config-categorias"
      >
        <div className="config-titulo">
          <div>
            <h2>
              Categorias
            </h2>

            <p>
              Escolha as categorias
              disponíveis nos lançamentos.
            </p>
          </div>
        </div>

        <div className="config-categorias">
          {configuracoes.categorias.map(
            (categoria) => (
              <div
                className="config-categoria"
                key={categoria}
              >
                <span>
                  {categoria}
                </span>

                {categoria !==
                  'Salário' && (
                  <button
                    onClick={() =>
                      excluirCategoria(
                        categoria
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            )
          )}
        </div>

        <div className="config-adicionar">
          <div className="campo">
            <label>
              Nova categoria
            </label>

            <input
              type="text"
              placeholder="Ex: Beleza"
              value={novaCategoria}
              onChange={(evento) =>
                setNovaCategoria(
                  evento.target.value
                )
              }
              onKeyDown={(evento) => {
                if (
                  evento.key ===
                  'Enter'
                ) {
                  adicionarCategoria();
                }
              }}
            />
          </div>

          <button
            className="btn-secondary"
            onClick={
              adicionarCategoria
            }
          >
            + Adicionar categoria
          </button>
        </div>
      </section>

      <div className="config-salvar-final">
        <button
          className="btn-primary"
          onClick={salvar}
          disabled={
            salvando
          }
        >
          {salvando
            ? 'Salvando...'
            : 'Salvar configurações'
          }
        </button>
      </div>
    </section>
  );
});

export default Configuracoes;
