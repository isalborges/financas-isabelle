import type {
  Lancamento,
  MovimentacaoInvestimento
} from '../App';

import type {
  ConfiguracoesFinanceiras
} from '../configuracoesFinanceiras';

import {
  calcularSaldoAnterior,
  totalInvestidoAteMes
} from './saldoFinanceiro';

export type ResumoMesAnual = {
  mes: string;
  nomeMes: string;
  dentroPeriodo: boolean;
  entradas: number;
  gastos: number;
  aportes: number;
  retiradas: number;
  investimentoLiquido: number;
  saldoFinal: number;
  patrimonioInvestido: number;
};

export type MetaAnualCaixinha = {
  id: string;
  nome: string;
  tipo:
    | 'percentual'
    | 'valor'
    | 'sem-meta';
  meta: number | null;
  realizado: number;
  progresso: number;
  faltante: number;
};

const nomesMeses = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez'
];

function mesDoLancamentoUnico(
  data: string
) {
  const partes =
    data.split('/');

  if (
    partes.length !== 3
  ) {
    return null;
  }

  const [
    ,
    mes,
    ano
  ] =
    partes;

  return `${ano}-${mes}`;
}

function indiceMes(
  mes: string
) {
  const [
    ano,
    numeroMes
  ] =
    mes
      .split('-')
      .map(Number);

  return (
    ano * 12 +
    numeroMes - 1
  );
}

function parcelaNoMes(
  lancamento: Lancamento,
  mes: string
) {
  if (
    !lancamento.parcelado ||
    !lancamento.primeiraParcela ||
    !lancamento.quantidadeParcelas ||
    !lancamento.parcelaAtual
  ) {
    return null;
  }

  const diferenca =
    indiceMes(
      mes
    ) -
    indiceMes(
      lancamento
        .primeiraParcela
        .slice(
          0,
          7
        )
    );

  const parcela =
    lancamento.parcelaAtual +
    diferenca;

  if (
    parcela < 1 ||
    parcela >
      lancamento.quantidadeParcelas
  ) {
    return null;
  }

  return parcela;
}

function aplicarExcecao(
  lancamento: Lancamento,
  mes: string
): Lancamento {
  if (
    !lancamento.recorrente
  ) {
    return lancamento;
  }

  const excecao =
    lancamento
      .recorrenciaExcecoes?.[
        mes
      ];

  if (
    !excecao
  ) {
    return lancamento;
  }

  return {
    ...lancamento,
    ...excecao
  };
}

export function lancamentoNoMes(
  lancamento: Lancamento,
  mes: string
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

    if (
      mes < inicio ||
      (
        fim &&
        mes > fim
      )
    ) {
      return null;
    }

    return aplicarExcecao(
      lancamento,
      mes
    );
  }

  if (
    lancamento.parcelado
  ) {
    return (
      parcelaNoMes(
        lancamento,
        mes
      ) === null
        ? null
        : lancamento
    );
  }

  return (
    mesDoLancamentoUnico(
      lancamento.data
    ) === mes
      ? lancamento
      : null
  );
}

export function resumoDoMes(
  lancamentos: Lancamento[],
  movimentacoes:
    MovimentacaoInvestimento[],
  configuracoes:
    ConfiguracoesFinanceiras,
  mes: string
) {
  const dentroPeriodo =
    !configuracoes.inicioControle ||
    mes >=
      configuracoes.inicioControle;

  if (
    !dentroPeriodo
  ) {
    return {
      entradas: 0,
      gastos: 0,
      aportes: 0,
      retiradas: 0,
      investimentoLiquido: 0,
      saldoFinal: 0,
      patrimonioInvestido: 0
    };
  }

  const lancamentosMes =
    lancamentos
      .map(
        (
          lancamento
        ) =>
          lancamentoNoMes(
            lancamento,
            mes
          )
      )
      .filter(
        (
          lancamento
        ): lancamento is Lancamento =>
          Boolean(
            lancamento
          )
      );

  const entradas =
    lancamentosMes
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
    lancamentosMes
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

  const movimentacoesMes =
    movimentacoes.filter(
      (
        movimentacao
      ) =>
        movimentacao.data
          .slice(
            0,
            7
          ) === mes
    );

  const aportes =
    movimentacoesMes
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

  const retiradas =
    movimentacoesMes
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

  const investimentoLiquido =
    aportes -
    retiradas;

  const saldoAnterior =
    calcularSaldoAnterior(
      lancamentos,
      movimentacoes,
      mes,
      configuracoes
    );

  const saldoFinal =
    saldoAnterior +
    entradas -
    gastos -
    investimentoLiquido;

  const patrimonioInvestido =
    totalInvestidoAteMes(
      configuracoes,
      movimentacoes,
      mes
    );

  return {
    entradas,
    gastos,
    aportes,
    retiradas,
    investimentoLiquido,
    saldoFinal,
    patrimonioInvestido
  };
}

export function construirResumoAnual(
  lancamentos: Lancamento[],
  movimentacoes:
    MovimentacaoInvestimento[],
  configuracoes:
    ConfiguracoesFinanceiras,
  ano: number
): ResumoMesAnual[] {
  return nomesMeses.map(
    (
      nomeMes,
      indice
    ) => {
      const mes =
        `${ano}-${String(
          indice + 1
        ).padStart(
          2,
          '0'
        )}`;

      const dentroPeriodo =
        !configuracoes
          .inicioControle ||
        mes >=
          configuracoes
            .inicioControle;

      const resumo =
        resumoDoMes(
          lancamentos,
          movimentacoes,
          configuracoes,
          mes
        );

      return {
        mes,
        nomeMes,
        dentroPeriodo,
        ...resumo
      };
    }
  );
}

function salarioDoMes(
  lancamentos: Lancamento[],
  mes: string
) {
  return lancamentos
    .map(
      (
        lancamento
      ) =>
        lancamentoNoMes(
          lancamento,
          mes
        )
    )
    .filter(
      (
        lancamento
      ): lancamento is Lancamento =>
        Boolean(
          lancamento
        )
    )
    .filter(
      (
        lancamento
      ) =>
        lancamento.tipo ===
          'Entrada' &&
        lancamento.categoria ===
          'Salário'
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
}

export function construirMetasAnuais(
  lancamentos: Lancamento[],
  movimentacoes:
    MovimentacaoInvestimento[],
  configuracoes:
    ConfiguracoesFinanceiras,
  ano: number
): MetaAnualCaixinha[] {
  const mesesValidos =
    Array.from(
      {
        length: 12
      },
      (
        _,
        indice
      ) =>
        `${ano}-${String(
          indice + 1
        ).padStart(
          2,
          '0'
        )}`
    )
      .filter(
        (
          mes
        ) =>
          !configuracoes
            .inicioControle ||
          mes >=
            configuracoes
              .inicioControle
      );

  return configuracoes
    .caixinhas
    .map(
      (
        caixinha
      ) => {
        const tipo =
          caixinha.tipoMeta ??
          (
            caixinha
              .percentualSalario ===
              null
              ? 'sem-meta'
              : 'percentual'
          );

        let meta:
          number | null =
            null;

        if (
          tipo === 'valor'
        ) {
          meta =
            (
              caixinha
                .valorMetaMensal ??
              0
            ) *
            mesesValidos.length;
        }

        if (
          tipo ===
            'percentual'
        ) {
          const percentual =
            (
              caixinha
                .percentualSalario ??
              0
            ) /
            100;

          meta =
            mesesValidos.reduce(
              (
                total,
                mes
              ) =>
                total +
                salarioDoMes(
                  lancamentos,
                  mes
                ) *
                percentual,
              0
            );
        }

        const realizado =
          movimentacoes
            .filter(
              (
                movimentacao
              ) =>
                movimentacao.tipo ===
                  'aporte' &&
                movimentacao.caixinha ===
                  caixinha.id &&
                movimentacao.data
                  .slice(
                    0,
                    4
                  ) ===
                  String(
                    ano
                  ) &&
                (
                  !configuracoes
                    .inicioControle ||
                  movimentacao.data
                    .slice(
                      0,
                      7
                    ) >=
                    configuracoes
                      .inicioControle
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

        const progresso =
          meta &&
          meta > 0
            ? Math.min(
                (
                  realizado /
                  meta
                ) *
                  100,
                100
              )
            : 0;

        return {
          id:
            caixinha.id,
          nome:
            caixinha.nome,
          tipo,
          meta,
          realizado,
          progresso,
          faltante:
            meta === null
              ? 0
              : Math.max(
                  meta -
                  realizado,
                  0
                )
        };
      }
    );
}
