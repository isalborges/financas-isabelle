import type {
  Lancamento,
  MovimentacaoInvestimento
} from '../../App';

import type {
  ConfiguracoesFinanceiras
} from '../../configuracoesFinanceiras';

import CardFinanceiro
  from '../CardFinanceiro';

import GraficoGastos
  from '../GraficoGastos/GraficoGastos';

import SeletorMes
  from '../SeletorMes/SeletorMes';

import {
  calcularSaldoAnterior,
  dataSaldoAnterior,
  nomeMesAnterior,
  totalInvestidoAteMes
} from '../../lib/saldoFinanceiro.ts';

type DashboardProps = {
  lancamentos:
    Lancamento[];

  movimentacoesInvestimento:
    MovimentacaoInvestimento[];

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

  editarLancamento:
    (lancamento: Lancamento) => void;

  abrirLancamentos:
    (id: number) => void;
};

type ItemHistorico = {
  id: string;
  origem:
    | 'lancamento'
    | 'investimento'
    | 'investimento_inicial'
    | 'saldo_anterior';
  lancamentoId?: number;
  data: string;
  dataOrdenacao: number;
  descricao: string;
  detalhe: string;
  tipo:
    | 'entrada'
    | 'saida'
    | 'aporte'
    | 'retirada';
  valor: number;
  tipoTexto?: string;
};

function Dashboard({
  lancamentos,
  movimentacoesInvestimento,
  configuracoes,
  mesSelecionado,
  mesAnterior,
  proximoMes,
  selecionarMes,
  editarLancamento,
  abrirLancamentos
}: DashboardProps) {

  function recorrenciaAtivaNoMes(
    lancamento:
      Lancamento
  ) {

    if (
      !lancamento.recorrente ||
      !lancamento.dataInicio
    ) {

      return false;

    }

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

    if (
      mesSelecionado <
      inicio
    ) {

      return false;

    }

    if (
      fim &&
      mesSelecionado >
      fim
    ) {

      return false;

    }

    return true;

  }

  function parcelaDoMes(
    lancamento:
      Lancamento
  ) {

    if (
      !lancamento.parcelado ||
      !lancamento.primeiraParcela ||
      !lancamento.quantidadeParcelas ||
      !lancamento.parcelaAtual
    ) {

      return null;

    }

    const [
      anoInicio,
      mesInicio
    ] =
      lancamento
        .primeiraParcela
        .split('-')
        .map(Number);

    const [
      anoSelecionado,
      mesSelecionadoNumero
    ] =
      mesSelecionado
        .split('-')
        .map(Number);

    const diferencaMeses =
      (
        anoSelecionado -
        anoInicio
      ) * 12
      +
      (
        mesSelecionadoNumero -
        mesInicio
      );

    const parcela =
      lancamento.parcelaAtual +
      diferencaMeses;

    if (
      parcela < 1 ||
      parcela >
      lancamento.quantidadeParcelas
    ) {

      return null;

    }

    return parcela;

  }

  function dataLancamentoNoMes(
    lancamento:
      Lancamento
  ) {

    if (
      lancamento.parcelado &&
      lancamento.primeiraParcela
    ) {

      const dataInicial =
        new Date(
          `${lancamento.primeiraParcela}T12:00:00`
        );

      const dia =
        dataInicial.getDate();

      const [
        ano,
        mes
      ] =
        mesSelecionado
          .split('-')
          .map(Number);

      const ultimoDia =
        new Date(
          ano,
          mes,
          0
        ).getDate();

      const diaReal =
        Math.min(
          dia,
          ultimoDia
        );

      return new Date(
        ano,
        mes - 1,
        diaReal
      ).toLocaleDateString(
        'pt-BR'
      );

    }

    if (
      lancamento.recorrente &&
      lancamento.dataInicio
    ) {

      const dataInicial =
        new Date(
          `${lancamento.dataInicio}T12:00:00`
        );

      const dia =
        dataInicial.getDate();

      const [
        ano,
        mes
      ] =
        mesSelecionado
          .split('-')
          .map(Number);

      const ultimoDia =
        new Date(
          ano,
          mes,
          0
        ).getDate();

      const diaReal =
        Math.min(
          dia,
          ultimoDia
        );

      return new Date(
        ano,
        mes - 1,
        diaReal
      ).toLocaleDateString(
        'pt-BR'
      );

    }

    return lancamento.data;

  }

  const lancamentosDoMes =
    (
      configuracoes.inicioControle &&
      mesSelecionado <
        configuracoes.inicioControle
    )
      ? []
      : lancamentos.filter(
      (
        lancamento
      ) => {

        if (
          lancamento.recorrente
        ) {

          return recorrenciaAtivaNoMes(
            lancamento
          );

        }

        if (
          lancamento.parcelado
        ) {

          return (
            parcelaDoMes(
              lancamento
            ) !== null
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
    );

  function statusManual(
    lancamento:
      Lancamento
  ) {

    const parcelaNoCredito =
      lancamento.parcelado &&
      (
        lancamento.formaPagamento ===
          'Crédito' ||
        lancamento.formaPagamento ===
          'Cartão'
      );

    return (
      lancamento.tipo ===
        'Saída' &&
      (
        (
          lancamento.parcelado &&
          !parcelaNoCredito
        ) ||
        lancamento.formaPagamento ===
          'PIX'
      )
    );

  }

  function estaPago(
    lancamento:
      Lancamento
  ) {

    if (
      !statusManual(
        lancamento
      )
    ) {

      return true;

    }

    return Boolean(
      lancamento
        .pagamentosPorMes?.[
          mesSelecionado
        ]
    );

  }

  const entradas =
    lancamentosDoMes

      .filter(
        (
          lancamento
        ) =>
          lancamento.tipo ===
          'Entrada'
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

  const gastos =
    lancamentosDoMes

      .filter(
        (
          lancamento
        ) =>
          lancamento.tipo ===
          'Saída'
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

  const investimentoLiquidoMes =
    movimentacoesInvestimento
      .filter(
        (movimentacao) =>
          movimentacao.data.slice(0, 7) ===
            mesSelecionado &&
          (
            !configuracoes.inicioControle ||
            mesSelecionado >=
              configuracoes.inicioControle
          )
      )
      .reduce(
        (total, movimentacao) =>
          movimentacao.tipo === 'aporte'
            ? total + movimentacao.valor
            : total - movimentacao.valor,
        0
      );

  const saldoAnterior =
    calcularSaldoAnterior(
      lancamentos,
      movimentacoesInvestimento,
      mesSelecionado,
      configuracoes
    );

  const saldoMesAtual =
    saldoAnterior +
    entradas -
    gastos -
    investimentoLiquidoMes;

  const mesAnteriorNome =
    nomeMesAnterior(
      mesSelecionado
    );

  const mesInicial =
    Boolean(
      configuracoes.inicioControle &&
      mesSelecionado ===
        configuracoes.inicioControle
    );

  const totalInvestido =
    totalInvestidoAteMes(
      configuracoes,
      movimentacoesInvestimento,
      mesSelecionado
    );

  function nomeCaixinha(
    id: string
  ) {
    return (
      configuracoes.caixinhas.find(
        (caixinha) =>
          caixinha.id === id
      )?.nome ??
      id
    );
  }

  function dataBRParaNumero(
    dataBR: string
  ) {
    const [
      dia,
      mes,
      ano
    ] =
      dataBR
        .split('/')
        .map(Number);

    return new Date(
      ano,
      mes - 1,
      dia
    ).getTime();
  }

  const historicoLancamentos:
    ItemHistorico[] =
      lancamentosDoMes.map(
        (lancamento) => {
          const dataExibida =
            dataLancamentoNoMes(
              lancamento
            );

          return {
            id:
              `lancamento-${lancamento.id}`,

            origem:
              'lancamento',

            lancamentoId:
              lancamento.id,

            data:
              dataExibida,

            dataOrdenacao:
              dataBRParaNumero(
                dataExibida
              ),

            descricao:
              lancamento.descricao,

            detalhe:
              lancamento.parcelado
                ? `${lancamento.categoria} • Parcela ${parcelaDoMes(lancamento)}/${lancamento.quantidadeParcelas}`
                : lancamento.recorrente
                  ? `${lancamento.categoria} • Conta fixa`
                  : lancamento.categoria,

            tipo:
              lancamento.tipo ===
                'Entrada'
                ? 'entrada'
                : 'saida',

            valor:
              lancamento.valor
          };
        }
      );

  const historicoInvestimentos:
    ItemHistorico[] =
      movimentacoesInvestimento
        .filter(
          (movimentacao) =>
            movimentacao.data
              .slice(
                0,
                7
              ) ===
              mesSelecionado &&
            (
              !configuracoes.inicioControle ||
              mesSelecionado >=
                configuracoes.inicioControle
            )
        )
        .map(
          (movimentacao) => {
            const dataObjeto =
              new Date(
                `${movimentacao.data}T12:00:00`
              );

            return {
              id:
                `investimento-${movimentacao.id}`,

              origem:
                'investimento',

              data:
                dataObjeto
                  .toLocaleDateString(
                    'pt-BR'
                  ),

              dataOrdenacao:
                dataObjeto.getTime(),

              descricao:
                movimentacao.tipo ===
                  'aporte'
                  ? 'Investimento'
                  : 'Retirada de investimento',

              detalhe:
                nomeCaixinha(
                  movimentacao.caixinha
                ),

              tipo:
                movimentacao.tipo,

              valor:
                movimentacao.valor
            };
          }
        );

  const historicoInvestimentosIniciais:
    ItemHistorico[] =
      mesInicial
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
            .map(
              (
                item
              ) => {
                const data =
                  dataSaldoAnterior(
                    mesSelecionado
                  );

                return {
                  id:
                    `investimento-inicial-${item.caixinha.id}`,

                  origem:
                    'investimento_inicial' as const,

                  data,

                  dataOrdenacao:
                    dataBRParaNumero(
                      data
                    ),

                  descricao:
                    'Saldo inicial investido',

                  detalhe:
                    `${item.caixinha.nome} • Automático`,

                  tipo:
                    'aporte' as const,

                  tipoTexto:
                    'Patrimônio inicial',

                  valor:
                    item.valor
                };
              }
            )
        : [];

  const historicoSaldoAnterior:
    ItemHistorico[] =
      (
        mesInicial ||
        saldoAnterior !== 0
      )
        ? [
            {
              id:
                `saldo-anterior-${mesSelecionado}`,

              origem:
                'saldo_anterior',

              data:
                dataSaldoAnterior(
                  mesSelecionado
                ),

              dataOrdenacao:
                dataBRParaNumero(
                  dataSaldoAnterior(
                    mesSelecionado
                  )
                ),

              descricao:
                mesInicial
                  ? 'Saldo inicial do controle'
                  : 'Saldo do mês anterior',

              detalhe:
                mesInicial
                  ? 'Definido nas configurações'
                  : `Gerado automaticamente • ${mesAnteriorNome}`,

              tipo:
                saldoAnterior >= 0
                  ? 'entrada'
                  : 'saida',

              tipoTexto:
                mesInicial
                  ? 'Saldo inicial'
                  : 'Saldo anterior',

              valor:
                Math.abs(
                  saldoAnterior
                )
            }
          ]
        : [];

  const historicoMes =
    [
      ...historicoLancamentos,
      ...historicoInvestimentos,
      ...historicoInvestimentosIniciais,
      ...historicoSaldoAnterior
    ].sort(
      (
        primeiro,
        segundo
      ) =>
        segundo.dataOrdenacao -
        primeiro.dataOrdenacao
    );

  const investidoMes =
    movimentacoesInvestimento

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.tipo ===
            'aporte' &&
          movimentacao.data
            .slice(
              0,
              7
            ) ===
            mesSelecionado &&
          (
            !configuracoes.inicioControle ||
            mesSelecionado >=
              configuracoes.inicioControle
          )
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

  const pagamentos =
    lancamentosDoMes
      .filter(
        (lancamento) =>
          lancamento.tipo ===
            'Saída' &&
          (
            lancamento.parcelado ||
            lancamento.formaPagamento ===
              'PIX'
          )
      )
      .sort(
        (
          primeiro,
          segundo
        ) => {
          const primeiroPago =
            estaPago(
              primeiro
            );

          const segundoPago =
            estaPago(
              segundo
            );

          if (
            primeiroPago !==
            segundoPago
          ) {
            return primeiroPago
              ? 1
              : -1;
          }

          return (
            dataBRParaNumero(
              dataLancamentoNoMes(
                primeiro
              )
            ) -
            dataBRParaNumero(
              dataLancamentoNoMes(
                segundo
              )
            )
          );
        }
      );

  const quantidadePendentes =
    pagamentos.filter(
      (lancamento) =>
        !estaPago(
          lancamento
        )
    ).length;

  function marcarComoPago(
    lancamento:
      Lancamento
  ) {

    editarLancamento({
      ...lancamento,

      pagamentosPorMes: {
        ...(
          lancamento
            .pagamentosPorMes ??
          {}
        ),

        [
          mesSelecionado
        ]:
          true
      }
    });

  }

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

  return (

    <section className="page">

      <div className="page-header">

        <div>

          <h1>
            Menu Principal
          </h1>

          <p>
            Acompanhe seu mês
            de forma simples.
          </p>

        </div>

      </div>

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

      <section className="card saldo">

        <span>
          Saldo mês atual
        </span>

        <h2>

          {formatarValor(
            saldoMesAtual
          )}

        </h2>

        {saldoAnterior !== 0 && (
          <p className="saldo-anterior-detalhe">
            {mesInicial
              ? `Inclui saldo inicial de ${formatarValor(saldoAnterior)} definido para o começo do controle.`
              : saldoAnterior >= 0
                ? `Inclui ${formatarValor(saldoAnterior)} trazidos de ${mesAnteriorNome}.`
                : `Inclui déficit de ${formatarValor(Math.abs(saldoAnterior))} trazido de ${mesAnteriorNome}.`
            }
          </p>
        )}

      </section>

      <section className="cards">

        <CardFinanceiro
          titulo="Entradas"

          valor={
            formatarValor(
              entradas
            )
          }
        />

        <CardFinanceiro
          titulo="Gastos"

          valor={
            formatarValor(
              gastos
            )
          }
        />

        <CardFinanceiro
          titulo="Investido no mês"

          valor={
            formatarValor(
              investidoMes
            )
          }
        />

        <CardFinanceiro
          titulo="Total investido"

          valor={
            formatarValor(
              totalInvestido
            )
          }
        />

      </section>

      <section className="dashboard-grid">

        <section className="card">

          <GraficoGastos
            lancamentos={
              lancamentosDoMes
            }
          />

        </section>

        <section className="card">

          <div className="titulo-pendencias">

            <div>

              <h2>
                Pendências
              </h2>

              <p>
                Pagamentos do mês.
                Pendentes ficam primeiro
                e pagos vão para o final.
              </p>

            </div>

            {quantidadePendentes >
              0 && (

              <span className="contador-pendencias">
                {quantidadePendentes}
              </span>

            )}

          </div>

          {pagamentos.length ===
            0 ? (

            <div className="sem-pendencias">
              <span>
                ✓
              </span>

              <div>
                <strong>
                  Tudo certo!
                </strong>

                <p>
                  Nenhum pagamento para
                  acompanhar neste mês.
                </p>
              </div>
            </div>

          ) : (

            <div className="lista-pendencias">

              {pagamentos.map(
                (
                  lancamento
                ) => {
                  const pago =
                    estaPago(
                      lancamento
                    );

                  return (
                    <div
                      className={`item-pendencia ${
                        pago
                          ? 'item-pendencia-pago'
                          : ''
                      }`}
                      key={
                        lancamento.id
                      }
                    >
                      <div className="pendencia-dados">
                        <strong>
                          {lancamento.descricao}
                        </strong>

                        <span>
                          {dataLancamentoNoMes(
                            lancamento
                          )}

                          {' • '}

                          {pago
                            ? (
                                lancamento.parcelado &&
                                (
                                  lancamento.formaPagamento ===
                                    'Crédito' ||
                                  lancamento.formaPagamento ===
                                    'Cartão'
                                )
                                  ? 'Pago automaticamente • Crédito'
                                  : 'Pago'
                              )
                            : lancamento.parcelado
                              ? 'Parcela pendente'
                              : 'PIX pendente'
                          }
                        </span>
                      </div>

                      <div className="pendencia-lado-direito">
                        <div className="pendencia-valor">
                          <strong>
                            {formatarValor(
                              lancamento.valor
                            )}
                          </strong>
                        </div>

                        <div className="pendencia-acoes">
                          {!pago && (
                            <button
                              type="button"
                              className="btn-status status-pago"
                              onClick={() =>
                                marcarComoPago(
                                  lancamento
                                )
                              }
                            >
                              ✓ Marcar pago
                            </button>
                          )}

                          {pago && (
                            <span className="pendencia-status-pago">
                              ✓ Pago
                            </span>
                          )}

                          <button
                            type="button"
                            className="btn-link-pendencia"
                            onClick={() =>
                              abrirLancamentos(
                                lancamento.id
                              )
                            }
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

      </section>

      <section className="card tabela historico-mes">
        <div className="historico-mes-topo">
          <div>
            <h2>
              Histórico do mês
            </h2>

            <p>
              Todas as movimentações do mês
              consolidadas em um só lugar.
            </p>
          </div>

          <span className="contador-secao">
            {historicoMes.length}
          </span>
        </div>

        {historicoMes.length === 0 ? (
          <div className="sem-lancamentos pequeno">
            <p>
              Nenhuma movimentação neste mês.
            </p>
          </div>
        ) : (
          <>
            <div className="tabela-container historico-desktop">
              <table className="historico-tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Detalhe</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {historicoMes.map((item) => {
                    const valorPositivo =
                      item.tipo === 'entrada' ||
                      item.tipo === 'retirada';

                    const textoTipo =
                      item.tipoTexto ??
                      (
                        item.tipo === 'entrada'
                          ? 'Entrada'
                          : item.tipo === 'saida'
                            ? 'Saída'
                            : item.tipo === 'aporte'
                              ? 'Investimento'
                              : 'Retirada'
                      );

                    return (
                      <tr
                        key={item.id}
                        className={
                          item.origem === 'lancamento'
                            ? 'linha-lancamento'
                            : ''
                        }
                        onClick={() => {
                          if (
                            item.origem === 'lancamento' &&
                            item.lancamentoId
                          ) {
                            abrirLancamentos(
                              item.lancamentoId
                            );
                          }
                        }}
                      >
                        <td>
                          {item.data}
                        </td>

                        <td>
                          {item.descricao}
                        </td>

                        <td>
                          {item.detalhe}
                        </td>

                        <td>
                          <span
                            className={`historico-badge historico-badge-${item.tipo}`}
                          >
                            {textoTipo}
                          </span>
                        </td>

                        <td>
                          <strong
                            className={
                              valorPositivo
                                ? 'historico-valor positivo'
                                : 'historico-valor negativo'
                            }
                          >
                            {valorPositivo ? '+ ' : '- '}
                            {formatarValor(
                              item.valor
                            )}
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="historico-mobile-lista">
              {historicoMes.map((item) => {
                const valorPositivo =
                  item.tipo === 'entrada' ||
                  item.tipo === 'retirada';

                const textoTipo =
                  item.tipo === 'entrada'
                    ? 'Entrada'
                    : item.tipo === 'saida'
                      ? 'Saída'
                      : item.tipo === 'aporte'
                        ? 'Investimento'
                        : 'Retirada';

                const clicavel =
                  item.origem === 'lancamento' &&
                  Boolean(item.lancamentoId);

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`historico-mobile-item ${
                      clicavel
                        ? 'clicavel'
                        : ''
                    }`}
                    onClick={() => {
                      if (
                        clicavel &&
                        item.lancamentoId
                      ) {
                        abrirLancamentos(
                          item.lancamentoId
                        );
                      }
                    }}
                  >
                    <div className="historico-mobile-topo">
                      <span className="historico-mobile-data">
                        {item.data}
                      </span>

                      <span
                        className={`historico-badge historico-badge-${item.tipo}`}
                      >
                        {textoTipo}
                      </span>
                    </div>

                    <div className="historico-mobile-corpo">
                      <div className="historico-mobile-textos">
                        <strong>
                          {item.descricao}
                        </strong>

                        <span>
                          {item.detalhe}
                        </span>
                      </div>

                      <strong
                        className={
                          valorPositivo
                            ? 'historico-valor positivo'
                            : 'historico-valor negativo'
                        }
                      >
                        {valorPositivo ? '+ ' : '- '}
                        {formatarValor(
                          item.valor
                        )}
                      </strong>
                    </div>

                    {clicavel && (
                      <span className="historico-mobile-editar">
                        Toque para editar
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </section>

  );

}

export default Dashboard;
