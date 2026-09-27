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
      | 'caixinhas'
      | 'categorias'
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
    <aside className="sidebar">
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
          onClick={() =>
            mudarPagina('dashboard')
          }
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
              mudarPagina('lancamentos')
            }
          >
            Lançamentos
          </a>

          {paginaAtual === 'lancamentos' && (
            <div className="sidebar-submenu">
              <button
                type="button"
                onClick={() =>
                  abrirSecaoLancamentos('entradas')
                }
              >
                Entradas
              </button>

              <button
                type="button"
                onClick={() =>
                  abrirSecaoLancamentos('fixas')
                }
              >
                Contas fixas
              </button>

              <button
                type="button"
                onClick={() =>
                  abrirSecaoLancamentos('parcelados')
                }
              >
                Parcelados
              </button>

              <button
                type="button"
                onClick={() =>
                  abrirSecaoLancamentos('gastos')
                }
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
          onClick={() =>
            mudarPagina('relatorios')
          }
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
              mudarPagina('investimentos')
            }
          >
            Investimentos
          </a>

          {paginaAtual === 'investimentos' && (
            <div className="sidebar-submenu">
              {configuracoes.caixinhas.map(
                (caixinha) => (
                  <button
                    type="button"
                    key={caixinha.id}
                    onClick={() =>
                      abrirCaixinhaInvestimento(
                        caixinha.id
                      )
                    }
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
              mudarPagina('configuracoes')
            }
          >
            Configurações
          </a>

          {paginaAtual === 'configuracoes' && (
            <div className="sidebar-submenu">
              <button
                type="button"
                onClick={() =>
                  abrirConfiguracao('perfil')
                }
              >
                Perfil
              </button>

              <button
                type="button"
                onClick={() =>
                  abrirConfiguracao('aparencia')
                }
              >
                Aparência
              </button>

              <button
                type="button"
                onClick={() =>
                  abrirConfiguracao('caixinhas')
                }
              >
                Caixinhas
              </button>

              <button
                type="button"
                onClick={() =>
                  abrirConfiguracao('categorias')
                }
              >
                Categorias
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
