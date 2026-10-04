import {
  useEffect,
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

import {
  confirmarAcao,
  notificar
} from '../../lib/feedback';

import {
  saldoInicialCaixinha
} from '../../lib/saldoFinanceiro';

type InvestimentosProps = {
  lancamentos:
    Lancamento[];

  movimentacoes:
    MovimentacaoInvestimento[];

  userId:
    string;

  adicionarMovimentacao:
    (
      movimentacao:
        Omit<
          MovimentacaoInvestimento,
          'id'
        >
    ) => Promise<boolean>;

  editarMovimentacao:
    (
      movimentacao:
        MovimentacaoInvestimento
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
  userId,
  adicionarMovimentacao,
  editarMovimentacao,
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

  const [
    movimentacaoEditando,
    setMovimentacaoEditando
  ] =
    useState<
      MovimentacaoInvestimento | null
    >(
      null
    );

  const chaveRascunhoMovimentacao =
    `controle-financeiro-rascunho-investimento-${userId}`;

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

  const [
    salvandoMovimentacao,
    setSalvandoMovimentacao
  ] =
    useState(false);

  const [
    excluindoMovimentacaoId,
    setExcluindoMovimentacaoId
  ] =
    useState<number | null>(null);

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
            mesSelecionado &&
          (
            !configuracoes
              .inicioControle ||
            mesSelecionado >=
              configuracoes
                .inicioControle
          )
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

  const mesInicialControle =
    Boolean(
      configuracoes.inicioControle &&
      mesSelecionado ===
        configuracoes.inicioControle
    );

  const investimentosIniciais =
    mesInicialControle
      ? configuracoes.caixinhas
          .map(
            (
              caixinha
            ) => ({
              caixinha,
              valor:
                Number(
                  configuracoes
                    .saldosIniciaisCaixinhas?.[
                      caixinha.id
                    ] ??
                  0
                )
            })
          )
          .filter(
            (
              item
            ) =>
              item.valor >
              0
          )
      : [];

  const totalItensMovimentacoesMes =
    movimentacoesDoMes.length +
    investimentosIniciais.length;

  const movimentacoesAteMes =
    movimentacoes

      .filter(
        (
          movimentacao
        ) => {
          const mes =
            movimentacao.data
              .slice(
                0,
                7
              );

          return (
            mes <=
              mesSelecionado &&
            (
              !configuracoes
                .inicioControle ||
              mes >=
                configuracoes
                  .inicioControle
            )
          );
        }
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
      string,
    ignorarMovimentacaoId?:
      number
  ) {

    const caixinhaConfigurada =
      configuracoes.caixinhas.find(
        (
          item
        ) =>
          item.id ===
            caixinha ||
          item.nome ===
            caixinha
      );

    const saldoInicial =
      caixinhaConfigurada
        ? saldoInicialCaixinha(
            configuracoes,
            caixinhaConfigurada.id,
            mesSelecionado
          )
        : 0;

    return movimentacoesAteMes

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.caixinha ===
            caixinha &&
          movimentacao.id !==
            ignorarMovimentacaoId
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

        saldoInicial
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

    localStorage.removeItem(
      chaveRascunhoMovimentacao
    );

    setMovimentacaoEditando(
      null
    );

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

  function abrirEdicaoMovimentacao(
    movimentacao:
      MovimentacaoInvestimento
  ) {

    setMovimentacaoEditando(
      movimentacao
    );

    setCaixinhaSelecionada(
      movimentacao.caixinha
    );

    setTipoMovimentacao(
      movimentacao.tipo
    );

    setValorMovimentacao(
      movimentacao.valor
        .toString()
    );

    setDataMovimentacao(
      movimentacao.data
    );

    setErroMovimentacao('');

    setMostrarFormulario(
      true
    );

  }

  function cancelarMovimentacao() {

    localStorage.removeItem(
      chaveRascunhoMovimentacao
    );

    setMostrarFormulario(
      false
    );

    setMovimentacaoEditando(
      null
    );

    setValorMovimentacao('');

    setErroMovimentacao('');

  }

  async function salvarMovimentacao() {

    if (
      salvandoMovimentacao
    ) {
      return;
    }

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
          caixinhaSelecionada,
          movimentacaoEditando?.id
        )
    ) {

      setErroMovimentacao(
        'A retirada não pode ser maior que o valor guardado nesta caixinha.'
      );

      return;

    }

    setSalvandoMovimentacao(
      true
    );

    const dadosMovimentacao = {
      caixinha:
        caixinhaSelecionada,
      tipo:
        tipoMovimentacao,
      valor,
      data:
        dataMovimentacao
    };

    try {
      const estavaEditando =
        Boolean(
          movimentacaoEditando
        );

      const sucesso =
        movimentacaoEditando
          ? await editarMovimentacao({
              id:
                movimentacaoEditando.id,
              ...dadosMovimentacao
            })
          : await adicionarMovimentacao(
              dadosMovimentacao
            );

      if (
        sucesso
      ) {
        notificar(
          estavaEditando
            ? 'Movimentação atualizada com sucesso.'
            : 'Movimentação adicionada com sucesso.',
          'sucesso'
        );

        cancelarMovimentacao();
      }
    }
    finally {
      setSalvandoMovimentacao(
        false
      );
    }

  }

  useEffect(
    () => {
      const rascunho =
        localStorage.getItem(
          chaveRascunhoMovimentacao
        );

      if (
        !rascunho
      ) {
        return;
      }

      try {
        const dados =
          JSON.parse(
            rascunho
          ) as {
            aberto?: boolean;
            caixinhaSelecionada?: string;
            tipoMovimentacao?: TipoMovimentacao;
            valorMovimentacao?: string;
            dataMovimentacao?: string;
            movimentacaoEditandoId?: number | null;
          };

        if (
          !dados.aberto
        ) {
          return;
        }

        const editando =
          dados.movimentacaoEditandoId
            ? movimentacoes.find(
                (
                  movimentacao
                ) =>
                  movimentacao.id ===
                  dados.movimentacaoEditandoId
              ) ?? null
            : null;

        setMovimentacaoEditando(
          editando
        );

        setCaixinhaSelecionada(
          dados.caixinhaSelecionada ??
            primeiraCaixinha
        );

        setTipoMovimentacao(
          dados.tipoMovimentacao ??
            'aporte'
        );

        setValorMovimentacao(
          dados.valorMovimentacao ??
            ''
        );

        setDataMovimentacao(
          dados.dataMovimentacao ??
            `${mesSelecionado}-01`
        );

        setMostrarFormulario(
          true
        );
      }
      catch {
        localStorage.removeItem(
          chaveRascunhoMovimentacao
        );
      }
    },
    [
      chaveRascunhoMovimentacao,
      movimentacoes,
      primeiraCaixinha,
      mesSelecionado
    ]
  );

  useEffect(
    () => {
      if (
        !mostrarFormulario
      ) {
        return;
      }

      localStorage.setItem(
        chaveRascunhoMovimentacao,
        JSON.stringify({
          aberto:
            true,
          caixinhaSelecionada,
          tipoMovimentacao,
          valorMovimentacao,
          dataMovimentacao,
          movimentacaoEditandoId:
            movimentacaoEditando?.id ??
            null
        })
      );
    },
    [
      mostrarFormulario,
      caixinhaSelecionada,
      tipoMovimentacao,
      valorMovimentacao,
      dataMovimentacao,
      movimentacaoEditando,
      chaveRascunhoMovimentacao
    ]
  );

  async function confirmarExclusaoMovimentacao(
    id:
      number
  ) {

    if (
      excluindoMovimentacaoId !==
      null
    ) {
      return;
    }

    const confirmar =
      await confirmarAcao({
        titulo:
          'Excluir movimentação?',
        mensagem:
          'Essa movimentação será removida do histórico de investimentos.',
        textoConfirmar:
          'Excluir',
        perigoso:
          true
      });

    if (
      !confirmar
    ) {
      return;
    }

    setExcluindoMovimentacaoId(
      id
    );

    try {
      const sucesso =
        await excluirMovimentacao(
          id
        );

      if (
        sucesso
      ) {
        notificar(
          'Movimentação excluída com sucesso.',
          'sucesso'
        );
      }
    }
    finally {
      setExcluindoMovimentacaoId(
        null
      );
    }

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
        mesMinimo={
          configuracoes.inicioControle
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
          onMouseDown={() => {
            if (
              !salvandoMovimentacao
            ) {
              cancelarMovimentacao();
            }
          }}
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
                  {movimentacaoEditando
                    ? 'Editar movimentação'
                    : 'Nova movimentação'
                  }
                </h2>

                <p>
                  {movimentacaoEditando
                    ? 'Atualize os dados desta movimentação.'
                    : 'Registre um aporte ou uma retirada.'
                  }
                </p>

              </div>

              <button
                type="button"
                className="modal-fechar"
                onClick={
                  cancelarMovimentacao
                }
                disabled={
                  salvandoMovimentacao
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
                disabled={
                  salvandoMovimentacao
                }
              >
                Cancelar
              </button>

              <button
                className="btn-primary"
                onClick={
                  salvarMovimentacao
                }
                disabled={
                  salvandoMovimentacao
                }
              >

                {salvandoMovimentacao
                  ? movimentacaoEditando
                    ? 'Atualizando...'
                    : 'Salvando...'
                  : movimentacaoEditando
                    ? 'Salvar alterações'
                    : tipoMovimentacao ===
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

            {totalItensMovimentacoesMes}

          </span>

        </div>

        {totalItensMovimentacoesMes ===
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

            {investimentosIniciais.map(
              (
                item
              ) => (

                <div
                  className="item-aporte item-aporte-inicial"
                  key={
                    `saldo-inicial-${item.caixinha.id}`
                  }
                >

                  <div className="aporte-info">

                    <strong>

                      {item.caixinha.nome}

                      <span className="badge-investimento-inicial">
                        Automático
                      </span>

                    </strong>

                    <span>

                      Saldo inicial investido

                      {' • '}

                      {formatarData(
                        `${configuracoes.inicioControle}-01`
                      )}

                    </span>

                  </div>

                  <div className="aporte-acoes">

                    <strong className="valor-aporte">

                      +{' '}

                      {formatarValor(
                        item.valor
                      )}

                    </strong>

                    <span
                      className="investimento-inicial-bloqueado"
                      title="Este valor foi definido nas Configurações iniciais da conta."
                    >
                      —
                    </span>

                  </div>

                </div>

              )
            )}

            {movimentacoesDoMes.map(
              (
                movimentacao
              ) => (

                <div
                  className="item-aporte item-aporte-clicavel"

                  key={
                    movimentacao.id
                  }

                  role="button"

                  tabIndex={0}

                  onClick={() =>
                    abrirEdicaoMovimentacao(
                      movimentacao
                    )
                  }

                  onKeyDown={(evento) => {
                    if (
                      evento.key === 'Enter' ||
                      evento.key === ' '
                    ) {
                      evento.preventDefault();

                      abrirEdicaoMovimentacao(
                        movimentacao
                      );
                    }
                  }}
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

                      onClick={(evento) => {
                        evento.stopPropagation();

                        confirmarExclusaoMovimentacao(
                          movimentacao.id
                        );
                      }}

                      title="Excluir movimentação"
                      disabled={
                        excluindoMovimentacaoId ===
                        movimentacao.id
                      }
                    >
                      {excluindoMovimentacaoId ===
                        movimentacao.id
                        ? '…'
                        : '×'
                      }
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
