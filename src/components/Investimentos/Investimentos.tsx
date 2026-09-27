import {
  useState
} from 'react';

import type {
  Lancamento,
  MovimentacaoInvestimento,
  TipoMovimentacaoInvestimento
} from '../../App';

import type {
  ConfiguracoesFinanceiras
} from '../../configuracoesFinanceiras';

import SeletorMes
  from '../SeletorMes/SeletorMes';

type InvestimentosProps = {
  lancamentos:
    Lancamento[];

  movimentacoes:
    MovimentacaoInvestimento[];

  adicionarMovimentacao:
    (
      movimentacao:
        Omit<
          MovimentacaoInvestimento,
          'id'
        >
    ) => Promise<boolean>;

  excluirMovimentacao:
    (
      id: number
    ) => Promise<boolean>;

  configuracoes:
    ConfiguracoesFinanceiras;

  mesSelecionado:
    string;

  mesAnterior:
    () => void;

  proximoMes:
    () => void;

  selecionarMes:
    (mes: string) => void;
};

type TipoMovimentacao =
  TipoMovimentacaoInvestimento;

function Investimentos({
  lancamentos,
  movimentacoes,
  adicionarMovimentacao,
  excluirMovimentacao,
  configuracoes,
  mesSelecionado,
  mesAnterior,
  proximoMes,
  selecionarMes
}: InvestimentosProps) {

  const [
    mostrarFormulario,
    setMostrarFormulario
  ] =
    useState(
      false
    );

  const primeiraCaixinha =
    configuracoes
      .caixinhas[0]?.id ??
    'renda-fixa';

  const [
    caixinhaSelecionada,
    setCaixinhaSelecionada
  ] =
    useState(
      primeiraCaixinha
    );

  const [
    tipoMovimentacao,
    setTipoMovimentacao
  ] =
    useState<
      TipoMovimentacao
    >(
      'aporte'
    );

  const [
    valorMovimentacao,
    setValorMovimentacao
  ] =
    useState('');

  const [
    dataMovimentacao,
    setDataMovimentacao
  ] =
    useState(
      `${mesSelecionado}-01`
    );

  const [
    erroMovimentacao,
    setErroMovimentacao
  ] =
    useState('');

  function formatarValor(
    valor:
      number
  ) {

    return valor.toLocaleString(
      'pt-BR',
      {
        style:
          'currency',

        currency:
          'BRL'
      }
    );

  }

  function formatarData(
    data:
      string
  ) {

    const [
      ano,
      mes,
      dia
    ] =
      data.split('-');

    return (
      `${dia}/${mes}/${ano}`
    );

  }

  function nomeCaixinha(
    id:
      string
  ) {

    return (
      configuracoes
        .caixinhas
        .find(
          (
            caixinha
          ) =>
            caixinha.id ===
            id
        )
        ?.nome ??
      id
    );

  }

  function lancamentoPertenceAoMes(
    lancamento:
      Lancamento
  ) {

    if (
      lancamento.recorrente &&
      lancamento.dataInicio
    ) {

      const inicio =
        lancamento
          .dataInicio
          .slice(
            0,
            7
          );

      const fim =
        lancamento.dataFim

          ? lancamento
              .dataFim
              .slice(
                0,
                7
              )

          : null;

      return (
        mesSelecionado >=
          inicio &&
        (
          !fim ||
          mesSelecionado <=
            fim
        )
      );

    }

    const partes =
      lancamento.data
        .split('/');

    if (
      partes.length !==
      3
    ) {

      return false;

    }

    const [
      ,
      mes,
      ano
    ] =
      partes;

    return (
      `${ano}-${mes}` ===
      mesSelecionado
    );

  }

  const salarioDoMes =
    lancamentos

      .filter(
        (
          lancamento
        ) =>
          lancamento.tipo ===
            'Entrada' &&
          lancamento.categoria ===
            'Salário' &&
          lancamentoPertenceAoMes(
            lancamento
          )
      )

      .reduce(
        (
          total,
          lancamento
        ) =>
          total +
          lancamento.valor,
        0
      );

  const movimentacoesDoMes =
    movimentacoes

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.data
            .slice(
              0,
              7
            ) ===
          mesSelecionado
      )

      .sort(
        (
          primeira,
          segunda
        ) =>
          primeira.data
            .localeCompare(
              segunda.data
            )
      );

  const movimentacoesAteMes =
    movimentacoes

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.data
            .slice(
              0,
              7
            ) <=
          mesSelecionado
      );

  function totalPorCaixinhaNoMes(
    caixinha:
      string,
    tipo:
      TipoMovimentacao
  ) {

    return movimentacoesDoMes

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.caixinha ===
            caixinha &&
          movimentacao.tipo ===
            tipo
      )

      .reduce(
        (
          total,
          movimentacao
        ) =>
          total +
          movimentacao.valor,
        0
      );

  }

  function saldoCaixinha(
    caixinha:
      string
  ) {

    return movimentacoesAteMes

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.caixinha ===
          caixinha
      )

      .reduce(
        (
          total,
          movimentacao
        ) =>

          movimentacao.tipo ===
            'aporte'

            ? total +
              movimentacao.valor

            : total -
              movimentacao.valor,

        0
      );

  }

  const totalGuardado =
    configuracoes
      .caixinhas

      .reduce(
        (
          total,
          caixinha
        ) =>
          total +
          saldoCaixinha(
            caixinha.id
          ),
        0
      );

  const totalAportadoMes =
    movimentacoesDoMes

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.tipo ===
          'aporte'
      )

      .reduce(
        (
          total,
          movimentacao
        ) =>
          total +
          movimentacao.valor,
        0
      );

  const totalRetiradoMes =
    movimentacoesDoMes

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.tipo ===
          'retirada'
      )

      .reduce(
        (
          total,
          movimentacao
        ) =>
          total +
          movimentacao.valor,
        0
      );

  function abrirMovimentacao(
    caixinha:
      string =
        primeiraCaixinha,

    tipo:
      TipoMovimentacao =
        'aporte'
  ) {

    setCaixinhaSelecionada(
      caixinha
    );

    setTipoMovimentacao(
      tipo
    );

    setValorMovimentacao('');

    setDataMovimentacao(
      `${mesSelecionado}-01`
    );

    setErroMovimentacao('');

    setMostrarFormulario(
      true
    );

  }

  function cancelarMovimentacao() {

    setMostrarFormulario(
      false
    );

    setValorMovimentacao('');

    setErroMovimentacao('');

  }

  async function salvarMovimentacao() {

    const valor =
      Number(
        valorMovimentacao
      );

    if (
      !valorMovimentacao ||
      valor <=
        0
    ) {

      setErroMovimentacao(
        'Informe um valor maior que zero.'
      );

      return;

    }

    if (
      !dataMovimentacao
    ) {

      setErroMovimentacao(
        'Informe a data da movimentação.'
      );

      return;

    }

    if (
      dataMovimentacao
        .slice(
          0,
          7
        ) !==
      mesSelecionado
    ) {

      setErroMovimentacao(
        'A data precisa estar dentro do mês selecionado.'
      );

      return;

    }

    if (
      tipoMovimentacao ===
        'retirada' &&
      valor >
        saldoCaixinha(
          caixinhaSelecionada
        )
    ) {

      setErroMovimentacao(
        'A retirada não pode ser maior que o valor guardado nesta caixinha.'
      );

      return;

    }

    const sucesso =
      await adicionarMovimentacao({
        caixinha:
          caixinhaSelecionada,
        tipo:
          tipoMovimentacao,
        valor,
        data:
          dataMovimentacao
      });

    if (
      sucesso
    ) {
      cancelarMovimentacao();
    }

  }

  async function confirmarExclusaoMovimentacao(
    id:
      number
  ) {

    const confirmar =
      window.confirm(
        'Deseja realmente excluir esta movimentação?'
      );

    if (
      !confirmar
    ) {

      return;

    }

    await excluirMovimentacao(
      id
    );

  }

  return (

    <section className="page">

      <SeletorMes
        mesSelecionado={
          mesSelecionado
        }

        mesAnterior={
          mesAnterior
        }

        proximoMes={
          proximoMes
        }

        selecionarMes={
          selecionarMes
        }
      />

      <section className="card investimento-total">

        <div>

          <span>
            Total guardado aproximadamente
          </span>

          <h2>

            {formatarValor(
              totalGuardado
            )}

          </h2>

          <p>
            Soma dos aportes menos
            as retiradas até este mês.
            Não inclui rendimentos.
          </p>

        </div>

      </section>

      <section className="cards investimentos-cards">

        <section className="card">

          <span>
            Aportado neste mês
          </span>

          <h3>

            {formatarValor(
              totalAportadoMes
            )}

          </h3>

        </section>

        <section className="card">

          <span>
            Retirado neste mês
          </span>

          <h3>

            {formatarValor(
              totalRetiradoMes
            )}

          </h3>

        </section>

        <section className="card">

          <span>
            Caixinhas ativas
          </span>

          <h3>

            {
              configuracoes
                .caixinhas
                .length
            }

          </h3>

        </section>

      </section>

      {mostrarFormulario && (

        <div
          className="modal-overlay"
          onMouseDown={
            cancelarMovimentacao
          }
        >

          <section
            className="card formulario-aporte modal-card"
            onMouseDown={(
              evento
            ) =>
              evento.stopPropagation()
            }
          >

            <div className="modal-topo">

              <div>

                <h2>
                  Nova movimentação
                </h2>

                <p>
                  Registre um aporte
                  ou uma retirada.
                </p>

              </div>

              <button
                type="button"
                className="modal-fechar"
                onClick={
                  cancelarMovimentacao
                }
              >
                ×
              </button>

            </div>

            {erroMovimentacao && (

              <div className="alerta-formulario">

                <strong>
                  Confira os dados.
                </strong>

                <span>
                  {erroMovimentacao}
                </span>

              </div>

            )}

            <div className="form-grid">

              <div className="campo">

                <label>
                  Tipo
                </label>

                <select
                  value={
                    tipoMovimentacao
                  }

                  onChange={(
                    evento
                  ) => {

                    setTipoMovimentacao(
                      evento
                        .target
                        .value ===
                        'retirada'

                        ? 'retirada'

                        : 'aporte'
                    );

                    setErroMovimentacao('');

                  }}
                >

                  <option value="aporte">
                    Aporte
                  </option>

                  <option value="retirada">
                    Retirada
                  </option>

                </select>

              </div>

              <div className="campo">

                <label>
                  Caixinha
                </label>

                <select
                  value={
                    caixinhaSelecionada
                  }

                  onChange={(
                    evento
                  ) => {

                    setCaixinhaSelecionada(
                      evento
                        .target
                        .value
                    );

                    setErroMovimentacao('');

                  }}
                >

                  {configuracoes
                    .caixinhas
                    .map(
                      (
                        caixinha
                      ) => (

                        <option
                          key={
                            caixinha.id
                          }

                          value={
                            caixinha.id
                          }
                        >

                          {caixinha.nome}

                        </option>

                      )
                    )}

                </select>

              </div>

              <div className="campo">

                <label>
                  Valor
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"

                  value={
                    valorMovimentacao
                  }

                  onChange={(
                    evento
                  ) => {

                    setValorMovimentacao(
                      evento
                        .target
                        .value
                    );

                    setErroMovimentacao('');

                  }}
                />

              </div>

              <div className="campo">

                <label>
                  Data
                </label>

                <input
                  type="date"

                  value={
                    dataMovimentacao
                  }

                  onChange={(
                    evento
                  ) => {

                    setDataMovimentacao(
                      evento
                        .target
                        .value
                    );

                    setErroMovimentacao('');

                  }}
                />

              </div>

            </div>

            <div className="form-actions">

              <button
                className="btn-secondary"
                onClick={
                  cancelarMovimentacao
                }
              >
                Cancelar
              </button>

              <button
                className="btn-primary"
                onClick={
                  salvarMovimentacao
                }
              >

                {tipoMovimentacao ===
                  'aporte'

                  ? 'Adicionar aporte'

                  : 'Registrar retirada'
                }

              </button>

            </div>

          </section>

        </div>

      )}

      <section className="caixinhas-grid">

        {configuracoes
          .caixinhas
          .map(
            (
              caixinha
            ) => {

              const aportadoMes =
                totalPorCaixinhaNoMes(
                  caixinha.id,
                  'aporte'
                );

              const retiradoMes =
                totalPorCaixinhaNoMes(
                  caixinha.id,
                  'retirada'
                );

              const saldo =
                saldoCaixinha(
                  caixinha.id
                );

              const meta =
                caixinha
                  .percentualSalario ===
                  null

                  ? null

                  : salarioDoMes *
                    (
                      caixinha
                        .percentualSalario /
                      100
                    );

              const progresso =
                meta &&
                meta >
                  0

                  ? Math.min(
                      (
                        aportadoMes /
                        meta
                      ) * 100,
                      100
                    )

                  : 0;

              const faltante =
                meta ===
                  null

                  ? 0

                  : Math.max(
                      meta -
                      aportadoMes,
                      0
                    );

              return (

                <section
                  className="card caixinha-card"
                  id={`caixinha-${caixinha.id}`}
                  key={
                    caixinha.id
                  }
                >

                  <div className="caixinha-cabecalho">

                    <div>

                      <span className="caixinha-icone">
                        ↗
                      </span>

                      <div>

                        <h2>
                          {caixinha.nome}
                        </h2>

                        <p>

                          {caixinha
                            .percentualSalario ===
                            null

                            ? 'Você decide quanto guardar em cada mês.'

                            : `Meta mensal de ${caixinha.percentualSalario}% do salário.`
                          }

                        </p>

                      </div>

                    </div>

                    <div className="caixinha-botoes">

                      <button
                        className="btn-aporte-pequeno"

                        onClick={() =>
                          abrirMovimentacao(
                            caixinha.id,
                            'aporte'
                          )
                        }
                      >
                        + Aporte
                      </button>

                      <button
                        className="btn-retirada-pequeno"

                        onClick={() =>
                          abrirMovimentacao(
                            caixinha.id,
                            'retirada'
                          )
                        }
                      >
                        Retirar
                      </button>

                    </div>

                  </div>

                  <div className="caixinha-saldo">

                    <span>
                      Guardado aproximadamente
                    </span>

                    <strong>

                      {formatarValor(
                        saldo
                      )}

                    </strong>

                  </div>

                  <div className="caixinha-valores">

                    <div>

                      <span>
                        Aportado no mês
                      </span>

                      <strong>

                        {formatarValor(
                          aportadoMes
                        )}

                      </strong>

                    </div>

                    <div>

                      <span>

                        {meta ===
                          null

                          ? 'Retirado no mês'

                          : 'Meta do mês'
                        }

                      </span>

                      <strong>

                        {formatarValor(
                          meta ===
                            null

                            ? retiradoMes

                            : meta
                        )}

                      </strong>

                    </div>

                  </div>

                  {meta !==
                    null && (

                    <div className="investimento-progresso">

                      <div className="investimento-progresso-texto">

                        <span>
                          Progresso da meta
                        </span>

                        <strong>
                          {Math.round(
                            progresso
                          )}%
                        </strong>

                      </div>

                      <div className="barra-progresso">

                        <div
                          className="barra-progresso-preenchimento"

                          style={{
                            width:
                              `${progresso}%`
                          }}
                        />

                      </div>

                    </div>

                  )}

                  {meta ===
                    null ? (

                    <div className="caixinha-aviso neutro">

                      Esta caixinha não possui
                      uma meta mensal fixa.

                    </div>

                  ) : meta ===
                    0 ? (

                    <div className="caixinha-aviso neutro">

                      Cadastre uma entrada
                      na categoria Salário
                      para calcular a meta.

                    </div>

                  ) : faltante >
                    0 ? (

                    <div className="caixinha-aviso pendente">

                      Faltam{' '}

                      <strong>

                        {formatarValor(
                          faltante
                        )}

                      </strong>

                      {' '}para completar
                      a meta deste mês.

                    </div>

                  ) : (

                    <div className="caixinha-aviso concluido">

                      ✓ Meta do mês atingida.

                    </div>

                  )}

                  {retiradoMes >
                    0 && (

                    <div className="caixinha-retirada-info">

                      Retirado neste mês:{' '}

                      <strong>

                        {formatarValor(
                          retiradoMes
                        )}

                      </strong>

                    </div>

                  )}

                </section>

              );

            }
          )}

      </section>

      <section className="card aportes-historico">

        <div className="aportes-historico-titulo">

          <div>

            <h2>
              Movimentações do mês
            </h2>

            <p>
              Aportes e retiradas
              das suas caixinhas.
            </p>

          </div>

          <span className="contador-aportes">

            {movimentacoesDoMes.length}

          </span>

        </div>

        {movimentacoesDoMes.length ===
          0 ? (

          <div className="sem-aportes">

            <span>
              ＋
            </span>

            <div>

              <strong>
                Nenhuma movimentação
              </strong>

              <p>
                Seus aportes e retiradas
                aparecerão aqui.
              </p>

            </div>

          </div>

        ) : (

          <div className="lista-aportes">

            {movimentacoesDoMes.map(
              (
                movimentacao
              ) => (

                <div
                  className="item-aporte"

                  key={
                    movimentacao.id
                  }
                >

                  <div className="aporte-info">

                    <strong>

                      {nomeCaixinha(
                        movimentacao.caixinha
                      )}

                    </strong>

                    <span>

                      {movimentacao.tipo ===
                        'aporte'

                        ? 'Aporte'

                        : 'Retirada'
                      }

                      {' • '}

                      {formatarData(
                        movimentacao.data
                      )}

                    </span>

                  </div>

                  <div className="aporte-acoes">

                    <strong
                      className={
                        movimentacao.tipo ===
                          'retirada'

                          ? 'valor-retirada'

                          : 'valor-aporte'
                      }
                    >

                      {movimentacao.tipo ===
                        'retirada'

                        ? '- '

                        : '+ '
                      }

                      {formatarValor(
                        movimentacao.valor
                      )}

                    </strong>

                    <button
                      className="btn-excluir"

                      onClick={() =>
                        confirmarExclusaoMovimentacao(
                          movimentacao.id
                        )
                      }

                      title="Excluir movimentação"
                    >
                      ×
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

    </section>

  );

}

export default Investimentos;
