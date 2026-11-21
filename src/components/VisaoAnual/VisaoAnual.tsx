import {
  useMemo,
  useState
} from 'react';

import type {
  Lancamento,
  MovimentacaoInvestimento
} from '../../App';

import type {
  ConfiguracoesFinanceiras
} from '../../configuracoesFinanceiras';

import {
  construirMetasAnuais,
  construirResumoAnual
} from '../../lib/visaoAnual';

import './VisaoAnual.css';

type VisaoAnualProps = {
  lancamentos:
    Lancamento[];
  movimentacoesInvestimento:
    MovimentacaoInvestimento[];
  configuracoes:
    ConfiguracoesFinanceiras;
};

function formatarValor(
  valor: number
) {
  return valor
    .toLocaleString(
      'pt-BR',
      {
        style:
          'currency',
        currency:
          'BRL'
      }
    );
}

function VisaoAnual({
  lancamentos,
  movimentacoesInvestimento,
  configuracoes
}: VisaoAnualProps) {
  const anoAtual =
    new Date()
      .getFullYear();

  const anoInicial =
    configuracoes
      .inicioControle
      ? Number(
          configuracoes
            .inicioControle
            .slice(
              0,
              4
            )
        )
      : anoAtual;

  const [
    anoSelecionado,
    setAnoSelecionado
  ] =
    useState(
      Math.max(
        anoAtual,
        anoInicial
      )
    );

  const resumo =
    useMemo(
      () =>
        construirResumoAnual(
          lancamentos,
          movimentacoesInvestimento,
          configuracoes,
          anoSelecionado
        ),
      [
        lancamentos,
        movimentacoesInvestimento,
        configuracoes,
        anoSelecionado
      ]
    );

  const metas =
    useMemo(
      () =>
        construirMetasAnuais(
          lancamentos,
          movimentacoesInvestimento,
          configuracoes,
          anoSelecionado
        ),
      [
        lancamentos,
        movimentacoesInvestimento,
        configuracoes,
        anoSelecionado
      ]
    );

  const mesesValidos =
    resumo.filter(
      (
        mes
      ) =>
        mes.dentroPeriodo
    );

  const totalEntradas =
    mesesValidos.reduce(
      (
        total,
        mes
      ) =>
        total +
        mes.entradas,
      0
    );

  const totalGastos =
    mesesValidos.reduce(
      (
        total,
        mes
      ) =>
        total +
        mes.gastos,
      0
    );

  const totalAportes =
    mesesValidos.reduce(
      (
        total,
        mes
      ) =>
        total +
        mes.aportes,
      0
    );

  const ultimoMesValido =
    [
      ...mesesValidos
    ].reverse()[0];

  const saldoFinal =
    ultimoMesValido
      ?.saldoFinal ??
    0;

  const patrimonioInvestido =
    ultimoMesValido
      ?.patrimonioInvestido ??
    0;

  const metasComValor =
    metas.filter(
      (
        meta
      ) =>
        meta.meta !==
        null
    );

  const metaAnualTotal =
    metasComValor.reduce(
      (
        total,
        meta
      ) =>
        total +
        (
          meta.meta ??
          0
        ),
      0
    );

  const realizadoMetas =
    metasComValor.reduce(
      (
        total,
        meta
      ) =>
        total +
        meta.realizado,
      0
    );

  const progressoGeral =
    metaAnualTotal >
      0
      ? Math.min(
          (
            realizadoMetas /
            metaAnualTotal
          ) *
            100,
          100
        )
      : 0;

  const maiorGasto =
    mesesValidos.reduce(
      (
        maior,
        mes
      ) =>
        mes.gastos >
          maior.gastos
          ? mes
          : maior,
      {
        nomeMes: '—',
        gastos: 0
      }
    );

  const melhorSaldo =
    mesesValidos.reduce(
      (
        melhor,
        mes
      ) =>
        mes.saldoFinal >
          melhor.saldoFinal
          ? mes
          : melhor,
      {
        nomeMes: '—',
        saldoFinal:
          Number.NEGATIVE_INFINITY
      }
    );

  const mediaGastos =
    mesesValidos.length >
      0
      ? totalGastos /
        mesesValidos.length
      : 0;

  function anoAnterior() {
    setAnoSelecionado(
      (
        ano
      ) =>
        Math.max(
          ano -
            1,
          anoInicial
        )
    );
  }

  function proximoAno() {
    setAnoSelecionado(
      (
        ano
      ) =>
        ano +
        1
    );
  }

  return (
    <div className="visao-anual">
      <div className="visao-anual-topo">
        <div>
          <h1>
            Visão Anual
          </h1>

          <p>
            Acompanhe entradas, gastos,
            investimentos, saldo e metas
            ao longo do ano.
          </p>
        </div>

        <div className="seletor-ano">
          <button
            type="button"
            onClick={
              anoAnterior
            }
            disabled={
              anoSelecionado <=
              anoInicial
            }
            aria-label="Ano anterior"
          >
            ‹
          </button>

          <strong>
            {anoSelecionado}
          </strong>

          <button
            type="button"
            onClick={
              proximoAno
            }
            aria-label="Próximo ano"
          >
            ›
          </button>
        </div>
      </div>

      <section className="visao-anual-cards">
        <article className="card anual-card">
          <span>
            Entradas no ano
          </span>

          <strong className="anual-positivo">
            {formatarValor(
              totalEntradas
            )}
          </strong>
        </article>

        <article className="card anual-card">
          <span>
            Gastos no ano
          </span>

          <strong className="anual-negativo">
            {formatarValor(
              totalGastos
            )}
          </strong>
        </article>

        <article className="card anual-card">
          <span>
            Investido no ano
          </span>

          <strong>
            {formatarValor(
              totalAportes
            )}
          </strong>
        </article>

        <article className="card anual-card">
          <span>
            Saldo acumulado
          </span>

          <strong
            className={
              saldoFinal >=
                0
                ? 'anual-positivo'
                : 'anual-negativo'
            }
          >
            {formatarValor(
              saldoFinal
            )}
          </strong>
        </article>

        <article className="card anual-card">
          <span>
            Patrimônio investido
          </span>

          <strong>
            {formatarValor(
              patrimonioInvestido
            )}
          </strong>
        </article>
      </section>

      <section className="card anual-metas">
        <div className="anual-secao-cabecalho">
          <div>
            <h2>
              Metas anuais de investimento
            </h2>

            <p>
              Calculadas automaticamente a
              partir das metas mensais de
              cada caixinha.
            </p>
          </div>

          {metaAnualTotal >
            0 && (
            <div className="anual-meta-geral">
              <span>
                Progresso geral
              </span>

              <strong>
                {Math.round(
                  progressoGeral
                )}%
              </strong>
            </div>
          )}
        </div>

        {metas.length ===
          0 ? (
          <div className="anual-vazio">
            Nenhuma caixinha configurada.
          </div>
        ) : (
          <div className="anual-metas-grid">
            {metas.map(
              (
                meta
              ) => (
                <article
                  key={
                    meta.id
                  }
                  className="anual-meta-card"
                >
                  <div className="anual-meta-titulo">
                    <div>
                      <strong>
                        {meta.nome}
                      </strong>

                      <span>
                        {meta.tipo ===
                          'valor'
                          ? 'Meta fixa em R$'
                          : meta.tipo ===
                              'percentual'
                            ? 'Meta baseada em %'
                            : 'Sem meta definida'
                        }
                      </span>
                    </div>

                    {meta.meta !==
                      null && (
                      <strong>
                        {Math.round(
                          meta.progresso
                        )}%
                      </strong>
                    )}
                  </div>

                  {meta.meta ===
                    null ? (
                    <div className="anual-meta-sem-meta">
                      Esta caixinha não possui
                      meta mensal, então não há
                      meta anual calculada.
                    </div>
                  ) : (
                    <>
                      <div className="anual-meta-valores">
                        <div>
                          <span>
                            Meta anual
                          </span>

                          <strong>
                            {formatarValor(
                              meta.meta
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Realizado
                          </span>

                          <strong>
                            {formatarValor(
                              meta.realizado
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Falta
                          </span>

                          <strong>
                            {formatarValor(
                              meta.faltante
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="anual-barra">
                        <div
                          style={{
                            width:
                              `${meta.progresso}%`
                          }}
                        />
                      </div>
                    </>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="card anual-meses">
        <div className="anual-secao-cabecalho">
          <div>
            <h2>
              Ano mês a mês
            </h2>

            <p>
              Valores reais de cada mês,
              respeitando o início do seu
              controle financeiro.
            </p>
          </div>
        </div>

        <div className="anual-tabela-wrapper">
          <table className="anual-tabela">
            <thead>
              <tr>
                <th>
                  Mês
                </th>

                <th>
                  Entradas
                </th>

                <th>
                  Gastos
                </th>

                <th>
                  Investido
                </th>

                <th>
                  Saldo final
                </th>

                <th>
                  Patrimônio
                </th>
              </tr>
            </thead>

            <tbody>
              {resumo.map(
                (
                  mes
                ) => (
                  <tr
                    key={
                      mes.mes
                    }
                    className={
                      !mes.dentroPeriodo
                        ? 'anual-mes-fora'
                        : ''
                    }
                  >
                    <td>
                      <strong>
                        {mes.nomeMes}
                      </strong>

                      {!mes.dentroPeriodo && (
                        <small>
                          Fora do período
                        </small>
                      )}
                    </td>

                    <td>
                      {mes.dentroPeriodo
                        ? formatarValor(
                            mes.entradas
                          )
                        : '—'
                      }
                    </td>

                    <td>
                      {mes.dentroPeriodo
                        ? formatarValor(
                            mes.gastos
                          )
                        : '—'
                      }
                    </td>

                    <td>
                      {mes.dentroPeriodo
                        ? formatarValor(
                            mes.aportes
                          )
                        : '—'
                      }
                    </td>

                    <td
                      className={
                        mes.saldoFinal >=
                          0
                          ? 'anual-positivo'
                          : 'anual-negativo'
                      }
                    >
                      {mes.dentroPeriodo
                        ? formatarValor(
                            mes.saldoFinal
                          )
                        : '—'
                      }
                    </td>

                    <td>
                      {mes.dentroPeriodo
                        ? formatarValor(
                            mes.patrimonioInvestido
                          )
                        : '—'
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="anual-insights">
        <article className="card anual-insight">
          <span>
            Mês com mais gastos
          </span>

          <strong>
            {maiorGasto.nomeMes}
          </strong>

          <small>
            {formatarValor(
              maiorGasto.gastos
            )}
          </small>
        </article>

        <article className="card anual-insight">
          <span>
            Melhor saldo final
          </span>

          <strong>
            {melhorSaldo.nomeMes}
          </strong>

          <small>
            {Number.isFinite(
              melhorSaldo
                .saldoFinal
            )
              ? formatarValor(
                  melhorSaldo
                    .saldoFinal
                )
              : formatarValor(
                  0
                )
            }
          </small>
        </article>

        <article className="card anual-insight">
          <span>
            Média mensal de gastos
          </span>

          <strong>
            {formatarValor(
              mediaGastos
            )}
          </strong>

          <small>
            considerando meses controlados
          </small>
        </article>
      </section>
    </div>
  );
}

export default VisaoAnual;
