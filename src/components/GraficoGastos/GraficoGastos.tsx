import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import type {
  Lancamento
} from '../../App';


type GraficoGastosProps = {
  lancamentos:
    Lancamento[];
};


const CORES = [
  '#d87598',
  '#e6a2ba',
  '#c989a4',
  '#efbfd0',
  '#b87591',
  '#f2d3de',
  '#a9637d',
  '#e7ccd5'
];


function GraficoGastos({
  lancamentos
}: GraficoGastosProps) {

  const categorias =
    lancamentos

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


  const dados =
    Object.entries(
      categorias
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


  function formatarValor(
    valor: number
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

    <div className="grafico">

      <h2>
        Distribuição dos gastos
      </h2>


      {dados.length ===
        0 ? (

        <div className="relatorio-vazio">

          Nenhum gasto registrado
          neste mês.

        </div>

      ) : (

        <ResponsiveContainer
          width="100%"
          height={330}
        >

          <PieChart>

            <Pie
              data={
                dados
              }

              dataKey="valor"

              nameKey="categoria"

              innerRadius={65}

              outerRadius={100}

              paddingAngle={3}
            >

              {dados.map(
                (
                  item,
                  index
                ) => (

                  <Cell
                    key={
                      item.categoria
                    }

                    fill={
                      CORES[
                        index %
                        CORES.length
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

      )}

    </div>

  );

}


export default GraficoGastos;
