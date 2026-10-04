import type {
  Lancamento,
  MovimentacaoInvestimento
} from '../App';

import type {
  ConfiguracoesFinanceiras
} from '../configuracoesFinanceiras';

export const SALDO_ANTERIOR_ID =
  Number.MIN_SAFE_INTEGER;

export const SALDO_INICIAL_ID =
  Number.MIN_SAFE_INTEGER + 1;

export function indiceMes(
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

export function mesPorIndice(
  indice: number
) {
  const ano =
    Math.floor(
      indice / 12
    );

  const mes =
    (
      indice % 12
    ) + 1;

  return `${ano}-${String(
    mes
  ).padStart(2, '0')}`;
}

export function mesDoLancamentoUnico(
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

export function parcelaDoLancamentoNoMes(
  lancamento: Lancamento,
  mesSelecionado: string
) {
  if (
    !lancamento.parcelado ||
    !lancamento.primeiraParcela ||
    !lancamento.quantidadeParcelas ||
    !lancamento.parcelaAtual
  ) {
    return null;
  }

  const diferencaMeses =
    indiceMes(
      mesSelecionado
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
    diferencaMeses;

  if (
    parcela < 1 ||
    parcela >
      lancamento
        .quantidadeParcelas
  ) {
    return null;
  }

  return parcela;
}

export function lancamentoPertenceAoMes(
  lancamento: Lancamento,
  mesSelecionado: string
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

  if (
    lancamento.parcelado
  ) {
    return (
      parcelaDoLancamentoNoMes(
        lancamento,
        mesSelecionado
      ) !== null
    );
  }

  return (
    mesDoLancamentoUnico(
      lancamento.data
    ) ===
    mesSelecionado
  );
}

function saldoLancamentosNoMes(
  lancamentos: Lancamento[],
  mes: string
) {
  return lancamentos
    .filter(
      (
        lancamento
      ) =>
        lancamentoPertenceAoMes(
          lancamento,
          mes
        )
    )
    .reduce(
      (
        total,
        lancamento
      ) =>
        lancamento.tipo ===
          'Entrada'
          ? total +
            lancamento.valor
          : total -
            lancamento.valor,
      0
    );
}

function saldoInvestimentosNoMes(
  movimentacoes:
    MovimentacaoInvestimento[],
  mes: string
) {
  return movimentacoes
    .filter(
      (
        movimentacao
      ) =>
        movimentacao.data
          .slice(
            0,
            7
          ) ===
        mes
    )
    .reduce(
      (
        total,
        movimentacao
      ) =>
        movimentacao.tipo ===
          'aporte'
          ? total -
            movimentacao.valor
          : total +
            movimentacao.valor,
      0
    );
}

function calcularSaldoAnteriorLegado(
  lancamentos: Lancamento[],
  movimentacoes:
    MovimentacaoInvestimento[],
  mesSelecionado: string
) {
  let saldo = 0;

  const meses =
    new Set<string>();

  lancamentos.forEach(
    (
      lancamento
    ) => {
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

        let atual =
          indiceMes(
            inicio
          );

        const limite =
          indiceMes(
            mesSelecionado
          );

        while (
          atual < limite
        ) {
          meses.add(
            mesPorIndice(
              atual
            )
          );

          atual += 1;
        }

        return;
      }

      if (
        lancamento.parcelado &&
        lancamento.primeiraParcela
      ) {
        let atual =
          indiceMes(
            lancamento
              .primeiraParcela
              .slice(
                0,
                7
              )
          );

        const limite =
          indiceMes(
            mesSelecionado
          );

        while (
          atual < limite
        ) {
          meses.add(
            mesPorIndice(
              atual
            )
          );

          atual += 1;
        }

        return;
      }

      const mes =
        mesDoLancamentoUnico(
          lancamento.data
        );

      if (
        mes &&
        mes <
          mesSelecionado
      ) {
        meses.add(
          mes
        );
      }
    }
  );

  movimentacoes.forEach(
    (
      movimentacao
    ) => {
      const mes =
        movimentacao.data
          .slice(
            0,
            7
          );

      if (
        mes <
        mesSelecionado
      ) {
        meses.add(
          mes
        );
      }
    }
  );

  [
    ...meses
  ]
    .sort()
    .forEach(
      (
        mes
      ) => {
        saldo +=
          saldoLancamentosNoMes(
            lancamentos,
            mes
          );

        saldo +=
          saldoInvestimentosNoMes(
            movimentacoes,
            mes
          );
      }
    );

  return saldo;
}

export function calcularSaldoAnterior(
  lancamentos: Lancamento[],
  movimentacoes:
    MovimentacaoInvestimento[],
  mesSelecionado: string,
  configuracoes?:
    ConfiguracoesFinanceiras
) {
  const inicio =
    configuracoes
      ?.inicioControle ??
    null;

  if (
    !inicio
  ) {
    return (
      calcularSaldoAnteriorLegado(
        lancamentos,
        movimentacoes,
        mesSelecionado
      )
    );
  }

  if (
    mesSelecionado <
    inicio
  ) {
    return 0;
  }

  let saldo =
    Number(
      configuracoes
        ?.saldoInicialDisponivel ??
      0
    );

  if (
    mesSelecionado ===
    inicio
  ) {
    return saldo;
  }

  let indiceAtual =
    indiceMes(
      inicio
    );

  const indiceLimite =
    indiceMes(
      mesSelecionado
    );

  while (
    indiceAtual <
    indiceLimite
  ) {
    const mes =
      mesPorIndice(
        indiceAtual
      );

    saldo +=
      saldoLancamentosNoMes(
        lancamentos,
        mes
      );

    saldo +=
      saldoInvestimentosNoMes(
        movimentacoes,
        mes
      );

    indiceAtual += 1;
  }

  return saldo;
}

export function saldoInicialCaixinha(
  configuracoes:
    ConfiguracoesFinanceiras,
  caixinhaId: string,
  mesSelecionado: string
) {
  if (
    !configuracoes.inicioControle ||
    mesSelecionado <
      configuracoes.inicioControle
  ) {
    return 0;
  }

  return Number(
    configuracoes
      .saldosIniciaisCaixinhas?.[
        caixinhaId
      ] ??
    0
  );
}

export function totalInvestidoAteMes(
  configuracoes:
    ConfiguracoesFinanceiras,
  movimentacoes:
    MovimentacaoInvestimento[],
  mesSelecionado: string
) {
  if (
    configuracoes.inicioControle &&
    mesSelecionado <
      configuracoes.inicioControle
  ) {
    return 0;
  }

  const saldoInicial =
    Object.values(
      configuracoes
        .saldosIniciaisCaixinhas ??
      {}
    )
      .reduce(
        (
          total,
          valor
        ) =>
          total +
          Number(
            valor ||
            0
          ),
        0
      );

  const inicio =
    configuracoes
      .inicioControle;

  const movimentacoesConsideradas =
    movimentacoes.filter(
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
            !inicio ||
            mes >=
              inicio
          )
        );
      }
    );

  return movimentacoesConsideradas
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

export function nomeMes(
  mesAno: string
) {
  const [
    ano,
    mes
  ] =
    mesAno
      .split('-')
      .map(Number);

  const data =
    new Date(
      ano,
      mes - 1,
      1
    );

  const nome =
    data.toLocaleDateString(
      'pt-BR',
      {
        month:
          'long',
        year:
          'numeric'
      }
    );

  return nome.replace(
    /^./,
    (
      primeiraLetra
    ) =>
      primeiraLetra
        .toUpperCase()
  );
}

export function nomeMesAnterior(
  mesSelecionado: string
) {
  const indice =
    indiceMes(
      mesSelecionado
    ) - 1;

  return nomeMes(
    mesPorIndice(
      indice
    )
  ).replace(
    / de \d{4}$/,
    ''
  );
}

export function dataSaldoAnterior(
  mesSelecionado: string
) {
  const [
    ano,
    mes
  ] =
    mesSelecionado
      .split('-');

  return `01/${mes}/${ano}`;
}
