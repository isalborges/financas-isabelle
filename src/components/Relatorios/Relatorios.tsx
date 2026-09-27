import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import type {
  Lancamento,
  MovimentacaoInvestimento
} from '../../App';

import SeletorMes
  from '../SeletorMes/SeletorMes';

type RelatoriosProps = {
  lancamentos:
    Lancamento[];

  movimentacoesInvestimento:
    MovimentacaoInvestimento[];

  mesSelecionado:
    string;

  mesAnterior:
    () => void;

  proximoMes:
    () => void;

  selecionarMes:
    (mes: string) => void;
};


const CORES_GRAFICO = [
  '#d87598',
  '#e6a2ba',
  '#c989a4',
  '#efbfd0',
  '#b87591',
  '#f2d3de',
  '#a9637d',
  '#e7ccd5'
];

function Relatorios({
  lancamentos,
  movimentacoesInvestimento,
  mesSelecionado,
  mesAnterior,
  proximoMes,
  selecionarMes
}: RelatoriosProps) {

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

  function nomeMes(
    mes:
      string
  ) {

    const [
      ano,
      numeroMes
    ] =
      mes.split('-');

    const nomes = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ];

    return (
      `${nomes[
        Number(
          numeroMes
        ) - 1
      ]} ${ano}`
    );

  }

  function nomeMesCurto(
    mes:
      string
  ) {

    const [
      ano,
      numeroMes
    ] =
      mes.split('-');

    const data =
      new Date(
        Number(
          ano
        ),
        Number(
          numeroMes
        ) - 1,
        1
      );

    const nome =
      data.toLocaleDateString(
        'pt-BR',
        {
          month:
            'short'
        }
      );

    return nome
      .replace(
        '.',
        ''
      )
      .replace(
        /^\w/,
        (
          letra
        ) =>
          letra.toUpperCase()
      );

  }

  function recorrenciaAtiva(
    lancamento:
      Lancamento,
    mesReferencia:
      string
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

    return (
      mesReferencia >=
        inicio &&
      (
        !fim ||
        mesReferencia <=
          fim
      )
    );

  }

  function parcelaNoMes(
    lancamento:
      Lancamento,
    mesReferencia:
      string
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
      anoReferencia,
      mesReferenciaNumero
    ] =
      mesReferencia
        .split('-')
        .map(Number);

    const diferencaMeses =
      (
        anoReferencia -
        anoInicio
      ) * 12
      +
      (
        mesReferenciaNumero -
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

  function pertenceAoMes(
    lancamento:
      Lancamento,
    mesReferencia:
      string
  ) {

    if (
      lancamento.recorrente
    ) {

      return recorrenciaAtiva(
        lancamento,
        mesReferencia
      );

    }

    if (
      lancamento.parcelado
    ) {

      return (
        parcelaNoMes(
          lancamento,
          mesReferencia
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
      mesReferencia
    );

  }

  function lancamentosDoMes(
    mesReferencia:
      string
  ) {

    return lancamentos.filter(
      (
        lancamento
      ) =>
        pertenceAoMes(
          lancamento,
          mesReferencia
        )
    );

  }

  function obterMesAnterior(
    mes:
      string
  ) {

    const [
      ano,
      numeroMes
    ] =
      mes
        .split('-')
        .map(Number);

    const data =
      new Date(
        ano,
        numeroMes - 2,
        1
      );

    return (
      `${data.getFullYear()}-${String(
        data.getMonth() + 1
      ).padStart(
        2,
        '0'
      )}`
    );

  }


  function investimentoLiquidoMes(
    mesReferencia:
      string
  ) {

    return movimentacoesInvestimento

      .filter(
        (
          movimentacao
        ) =>
          movimentacao.data
            .slice(
              0,
              7
            ) ===
          mesReferencia
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

  function totalAportadoMes(
    mesReferencia:
      string
  ) {

    return movimentacoesInvestimento

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
          mesReferencia
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

  const totalInvestidoAcumulado =
    movimentacoesInvestimento

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

  const dadosMes =
    lancamentosDoMes(
      mesSelecionado
    );

  const entradas =
    dadosMes

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

  const gastosMensais =
    dadosMes

      .filter(
        (
          lancamento
        ) =>
          lancamento.tipo ===
            'Saída' &&
          !lancamento.parcelado
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

  const parcelas =
    dadosMes

      .filter(
        (
          lancamento
        ) =>
          lancamento.tipo ===
            'Saída' &&
          lancamento.parcelado
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

  const totalGastos =
    gastosMensais +
    parcelas;

  const investidoMes =
    totalAportadoMes(
      mesSelecionado
    );

  const investimentoLiquido =
    investimentoLiquidoMes(
      mesSelecionado
    );

  const saldoAposGastos =
    entradas -
    totalGastos -
    investimentoLiquido;

  const mesAnteriorReferencia =
    obterMesAnterior(
      mesSelecionado
    );

  const dadosMesAnterior =
    lancamentosDoMes(
      mesAnteriorReferencia
    );

  const gastosMesAnterior =
    dadosMesAnterior

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

  const diferencaGastos =
    totalGastos -
    gastosMesAnterior;

  const percentualDiferenca =
    gastosMesAnterior >
      0

      ? (
          diferencaGastos /
          gastosMesAnterior
        ) * 100

      : 0;

  const categoriasMap =
    dadosMes

      .filter(
        (
          lancamento
        ) =>
          lancamento.tipo ===
          'Saída'
      )

      .reduce(
        (
          acumulador,
          lancamento
        ) => {

          acumulador[
            lancamento.categoria
          ] =
            (
              acumulador[
                lancamento.categoria
              ] ??
              0
            )
            +
            lancamento.valor;

          return acumulador;

        },
        {} as Record<
          string,
          number
        >
      );

  const dadosCategorias =
    Object.entries(
      categoriasMap
    )

      .map(
        ([
          categoria,
          valor
        ]) => ({
          categoria,
          valor
        })
      )

      .sort(
        (
          a,
          b
        ) =>
          b.valor -
          a.valor
      );

  function obterUltimosMeses(
    quantidade:
      number
  ) {

    const [
      ano,
      mes
    ] =
      mesSelecionado
        .split('-')
        .map(Number);

    const meses:
      string[] = [];

    for (
      let indice =
        quantidade - 1;

      indice >= 0;

      indice--
    ) {

      const data =
        new Date(
          ano,
          mes - 1 - indice,
          1
        );

      meses.push(
        `${data.getFullYear()}-${String(
          data.getMonth() + 1
        ).padStart(
          2,
          '0'
        )}`
      );

    }

    return meses;

  }

  const evolucaoMensal =
    obterUltimosMeses(
      6
    ).map(
      (
        mes
      ) => {

        const dados =
          lancamentosDoMes(
            mes
          );

        const entradasMes =
          dados

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

        const gastosMes =
          dados

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

        return {
          mes:
            nomeMesCurto(
              mes
            ),

          Entradas:
            entradasMes,

          Gastos:
            gastosMes
        };

      }
    );

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

      <section className="relatorio-resumo">

        <section className="card relatorio-card">

          <span>
            Entradas
          </span>

          <strong className="relatorio-valor entrada-relatorio">

            {formatarValor(
              entradas
            )}

          </strong>

        </section>

        <section className="card relatorio-card">

          <span>
            Gastos mensais
          </span>

          <strong className="relatorio-valor">

            {formatarValor(
              gastosMensais
            )}

          </strong>

        </section>

        <section className="card relatorio-card">

          <span>
            Parcelas
          </span>

          <strong className="relatorio-valor">

            {formatarValor(
              parcelas
            )}

          </strong>

        </section>

        <section className="card relatorio-card">

          <span>
            Investido no mês
          </span>

          <strong className="relatorio-valor investimento-relatorio">

            {formatarValor(
              investidoMes
            )}

          </strong>

        </section>

      </section>

      <section className="relatorio-saldos">

        <section className="card relatorio-saldo-card">

          <span>
            Saldo após gastos e investimentos
          </span>

          <strong>

            {formatarValor(
              saldoAposGastos
            )}

          </strong>

          <p>
            Entradas menos gastos,
            parcelas e investimento
            líquido do mês.
          </p>

        </section>

        <section className="card relatorio-saldo-card destaque">

          <span>
            Total investido acumulado
          </span>

          <strong>

            {formatarValor(
              totalInvestidoAcumulado
            )}

          </strong>

          <p>
            Soma dos aportes menos
            retiradas até o mês selecionado.
          </p>

        </section>

      </section>

      <section className="card comparacao-mensal">

        <div>

          <span className="relatorio-label">
            Comparação com o mês anterior
          </span>

          {gastosMesAnterior ===
            0 ? (

            <h3>
              Ainda não há gastos suficientes
              no mês anterior para comparar.
            </h3>

          ) : diferencaGastos >
            0 ? (

            <>

              <h3>

                Você gastou{' '}

                <strong>

                  {formatarValor(
                    Math.abs(
                      diferencaGastos
                    )
                  )}

                </strong>

                {' '}a mais.

              </h3>

              <p>

                Aumento de aproximadamente{' '}

                {Math.abs(
                  percentualDiferenca
                ).toFixed(
                  1
                )}

                % em relação a{' '}

                {nomeMes(
                  mesAnteriorReferencia
                )}.

              </p>

            </>

          ) : diferencaGastos <
            0 ? (

            <>

              <h3>

                Você gastou{' '}

                <strong>

                  {formatarValor(
                    Math.abs(
                      diferencaGastos
                    )
                  )}

                </strong>

                {' '}a menos.

              </h3>

              <p>

                Redução de aproximadamente{' '}

                {Math.abs(
                  percentualDiferenca
                ).toFixed(
                  1
                )}

                % em relação a{' '}

                {nomeMes(
                  mesAnteriorReferencia
                )}.

              </p>

            </>

          ) : (

            <>

              <h3>
                Seus gastos ficaram iguais
                ao mês anterior.
              </h3>

              <p>
                Não houve diferença no total.
              </p>

            </>

          )}

        </div>

      </section>

      <section className="relatorios-graficos">

        <section className="card relatorio-grafico-card">

          <div className="relatorio-grafico-titulo">

            <h2>
              Gastos por categoria
            </h2>

            <p>
              Distribuição dos gastos
              deste mês.
            </p>

          </div>

          {dadosCategorias.length ===
            0 ? (

            <div className="relatorio-vazio">

              Nenhum gasto registrado
              neste mês.

            </div>

          ) : (

            <div className="grafico-relatorio">

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <PieChart>

                  <Pie
                    data={
                      dadosCategorias
                    }

                    dataKey="valor"

                    nameKey="categoria"

                    innerRadius={65}

                    outerRadius={100}

                    paddingAngle={3}
                  >

                    {dadosCategorias.map(
                      (
                        item,
                        index
                      ) => (

                        <Cell
                          key={
                            item.categoria
                          }

                          fill={
                            CORES_GRAFICO[
                              index %
                              CORES_GRAFICO.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(
                      valor
                    ) =>
                      formatarValor(
                        Number(
                          valor
                        )
                      )
                    }
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={54}

                    formatter={(
                      valor
                    ) => (
                      <span className="grafico-legenda-texto">
                        {valor}
                      </span>
                    )}
                  />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

        </section>

        <section className="card relatorio-grafico-card">

          <div className="relatorio-grafico-titulo">

            <h2>
              Evolução mensal
            </h2>

            <p>
              Entradas e gastos
              dos últimos 6 meses.
            </p>

          </div>

          <div className="grafico-relatorio">

            <ResponsiveContainer
              width="100%"
              height={280}
            >

              <BarChart
                data={
                  evolucaoMensal
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="mes"
                />

                <YAxis
                  width={65}
                />

                <Tooltip
                  formatter={(
                    valor
                  ) =>
                    formatarValor(
                      Number(
                        valor
                      )
                    )
                  }
                />

                <Bar
                  dataKey="Entradas"
                  fill="#91caaa"

                  radius={[
                    5,
                    5,
                    0,
                    0
                  ]}
                />

                <Bar
                  dataKey="Gastos"
                  fill="#d87598"

                  radius={[
                    5,
                    5,
                    0,
                    0
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

      </section>

      <section className="card ranking-categorias">

        <div className="relatorio-grafico-titulo">

          <h2>
            Onde você mais gastou
          </h2>

          <p>
            Categorias em ordem
            do maior para o menor gasto.
          </p>

        </div>

        {dadosCategorias.length ===
          0 ? (

          <div className="relatorio-vazio">

            Nenhuma categoria
            para mostrar.

          </div>

        ) : (

          <div className="ranking-lista">

            {dadosCategorias.map(
              (
                item,
                index
              ) => {

                const percentual =
                  totalGastos >
                    0

                    ? (
                        item.valor /
                        totalGastos
                      ) * 100

                    : 0;

                return (

                  <div
                    className="ranking-item"
                    key={
                      item.categoria
                    }
                  >

                    <div className="ranking-posicao">

                      {index + 1}

                    </div>

                    <div className="ranking-conteudo">

                      <div className="ranking-texto">

                        <div>

                          <strong>
                            {item.categoria}
                          </strong>

                          <span>

                            {percentual.toFixed(
                              1
                            )}

                            % dos gastos

                          </span>

                        </div>

                        <strong>

                          {formatarValor(
                            item.valor
                          )}

                        </strong>

                      </div>

                      <div className="ranking-barra">

                        <div
                          className="ranking-barra-preenchimento"

                          style={{
                            width:
                              `${percentual}%`
                          }}
                        />

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

  );

}

export default Relatorios;
