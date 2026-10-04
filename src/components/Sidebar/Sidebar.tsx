import { useState } from 'react';

import type {
  ConfiguracoesFinanceiras
} from '../../configuracoesFinanceiras';

type SidebarProps = {
  paginaAtual: string;
  mudarPagina: (pagina: string) => void;

  abrirConfiguracao: (
    secao:
      | 'perfil'
      | 'aparencia'
      | 'configuracoes-iniciais'
      | 'caixinhas'
      | 'categorias'
      | 'formas-pagamento'
  ) => void;

  abrirSecaoLancamentos: (
    secao:
      | 'fixas'
      | 'parcelados'
      | 'entradas'
      | 'gastos'
  ) => void;

  abrirCaixinhaInvestimento: (
    id: string
  ) => void;

  nomeUsuario: string;
  emailUsuario: string;
  avatarTipo: string;
  avatarUrl: string | null;
  configuracoes:
    ConfiguracoesFinanceiras;
  onSair: () => void;
};

function Sidebar({
  paginaAtual,
  mudarPagina,
  abrirConfiguracao,
  abrirSecaoLancamentos,
  abrirCaixinhaInvestimento,
  nomeUsuario,
  emailUsuario,
  avatarTipo,
  avatarUrl,
  configuracoes,
  onSair
}: SidebarProps) {
  const [
    menuMobileAberto,
    setMenuMobileAberto
  ] = useState(false);

  const [
    grupoAberto,
    setGrupoAberto
  ] = useState<
    | 'lancamentos'
    | 'investimentos'
    | 'configuracoes'
    | null
  >(null);

  function alternarGrupo(
    grupo:
      | 'lancamentos'
      | 'investimentos'
      | 'configuracoes'
  ) {
    setGrupoAberto(
      (grupoAtual) =>
        grupoAtual === grupo
          ? null
          : grupo
    );
  }

  function fecharMenuMobile() {
    setMenuMobileAberto(false);
  }

  function clicarGrupoPrincipal(
    grupo:
      | 'lancamentos'
      | 'investimentos'
      | 'configuracoes',
    pagina:
      | 'lancamentos'
      | 'investimentos'
      | 'configuracoes'
  ) {
    const desktop =
      window.innerWidth > 768;

    if (
      desktop
    ) {
      setGrupoAberto(
        grupo
      );

      void mudarPagina(
        pagina
      );

      return;
    }

    alternarGrupo(
      grupo
    );
  }

  const emojis: Record<
    string,
    string
  > = {
    tubarao: '🦈',
    macaco: '🐵',
    gato: '🐱',
    cachorro: '🐶',
    panda: '🐼'
  };

  const avatarEmoji =
    emojis[
      avatarTipo
    ] ?? '🦈';

  return (
    <aside
      className={`sidebar ${
        menuMobileAberto
          ? 'sidebar-mobile-aberta'
          : ''
      }`}
    >
      <button
        type="button"
        className="sidebar-mobile-toggle"
        aria-label={
          menuMobileAberto
            ? 'Fechar menu'
            : 'Abrir menu'
        }
        onClick={() =>
          setMenuMobileAberto(
            (aberto) => !aberto
          )
        }
      >
        {menuMobileAberto
          ? '×'
          : '☰'
        }
      </button>

      <div className="logo">
        <div className="avatar">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Foto de ${nomeUsuario}`}
              className="avatar-imagem"
            />
          ) : (
            <span className="avatar-emoji">
              {avatarEmoji}
            </span>
          )}
        </div>

        <div className="sidebar-usuario-texto">
          <h2>
            {nomeUsuario}
          </h2>

          <small title={emailUsuario}>
            Minhas finanças
          </small>
        </div>
      </div>

      <nav>
        <a
          className={
            paginaAtual === 'dashboard'
              ? 'active'
              : ''
          }
          onClick={() => {
            mudarPagina('dashboard');
            fecharMenuMobile();
          }}
        >
          Menu Principal
        </a>

        <div className="sidebar-grupo">
          <a
            className={
              paginaAtual === 'lancamentos'
                ? 'active'
                : ''
            }
            onClick={() =>
              clicarGrupoPrincipal(
                'lancamentos',
                'lancamentos'
              )
            }
          >
            <span>
              Lançamentos
            </span>

            <span className="sidebar-chevron">
              {grupoAberto ===
                'lancamentos'
                ? '⌃'
                : '⌄'
              }
            </span>
          </a>

          {grupoAberto === 'lancamentos' && (
            <div className="sidebar-submenu">
              <button
                type="button"
                onClick={() => {
                  abrirSecaoLancamentos('entradas');
                  fecharMenuMobile();
                }}
              >
                Entradas
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirSecaoLancamentos('fixas');
                  fecharMenuMobile();
                }}
              >
                Contas fixas
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirSecaoLancamentos('parcelados');
                  fecharMenuMobile();
                }}
              >
                Parcelados
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirSecaoLancamentos('gastos');
                  fecharMenuMobile();
                }}
              >
                Gastos do mês
              </button>
            </div>
          )}
        </div>

        <a
          className={
            paginaAtual === 'relatorios'
              ? 'active'
              : ''
          }
          onClick={() => {
            mudarPagina('relatorios');
            fecharMenuMobile();
          }}
        >
          Relatórios
        </a>

        <div className="sidebar-grupo">
          <a
            className={
              paginaAtual === 'investimentos'
                ? 'active'
                : ''
            }
            onClick={() =>
              clicarGrupoPrincipal(
                'investimentos',
                'investimentos'
              )
            }
          >
            <span>
              Investimentos
            </span>

            <span className="sidebar-chevron">
              {grupoAberto ===
                'investimentos'
                ? '⌃'
                : '⌄'
              }
            </span>
          </a>

          {grupoAberto === 'investimentos' && (
            <div className="sidebar-submenu">
              {configuracoes.caixinhas.map(
                (caixinha) => (
                  <button
                    type="button"
                    key={caixinha.id}
                    onClick={() => {
                      abrirCaixinhaInvestimento(
                        caixinha.id
                      );
                      fecharMenuMobile();
                    }}
                  >
                    {caixinha.nome}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div className="sidebar-grupo">
          <a
            className={
              paginaAtual === 'configuracoes'
                ? 'active'
                : ''
            }
            onClick={() =>
              clicarGrupoPrincipal(
                'configuracoes',
                'configuracoes'
              )
            }
          >
            <span>
              Configurações
            </span>

            <span className="sidebar-chevron">
              {grupoAberto ===
                'configuracoes'
                ? '⌃'
                : '⌄'
              }
            </span>
          </a>

          {grupoAberto === 'configuracoes' && (
            <div className="sidebar-submenu">
              <button
                type="button"
                onClick={() => {
                  abrirConfiguracao('perfil');
                  fecharMenuMobile();
                }}
              >
                Perfil
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirConfiguracao('aparencia');
                  fecharMenuMobile();
                }}
              >
                Aparência
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirConfiguracao(
                    'configuracoes-iniciais'
                  );
                  fecharMenuMobile();
                }}
              >
                Configurações iniciais da conta
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirConfiguracao('caixinhas');
                  fecharMenuMobile();
                }}
              >
                Caixinhas
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirConfiguracao('categorias');
                  fecharMenuMobile();
                }}
              >
                Categorias
              </button>

              <button
                type="button"
                onClick={() => {
                  abrirConfiguracao('formas-pagamento');
                  fecharMenuMobile();
                }}
              >
                Formas de pagamento
              </button>
            </div>
          )}
        </div>
      </nav>

      <button
        type="button"
        className="sidebar-sair"
        onClick={
          onSair
        }
      >
        Sair da conta
      </button>
    </aside>
  );
}

export default Sidebar;
