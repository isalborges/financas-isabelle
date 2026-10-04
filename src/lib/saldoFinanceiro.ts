import type {
  Lancamento,
  MovimentacaoInvestimento
} from '../App';

export const SALDO_ANTERIOR_ID =
  Number.MIN_SAFE_INTEGER;

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

function quantidadeMesesInclusivos(
  inicio: string,
  fim: string
) {
  const diferenca =
    indiceMes(fim) -
    indiceMes(inicio);

  return Math.max(
    0,
    diferenca + 1
  );
}

function contribuicaoLancamentoAntesDoMes(
  lancamento: Lancamento,
  mesSelecionado: string
) {
  const sinal =
    lancamento.tipo ===
      'Entrada'
      ? 1
      : -1;

  if (
    lancamento.recorrente &&
    lancamento.dataInicio
  ) {
    const mesInicio =
      lancamento.dataInicio
        .slice(
          0,
          7
        );

    const indiceLimite =
      indiceMes(
        mesSelecionado
      ) - 1;

    if (
      indiceMes(
        mesInicio
      ) >
      indiceLimite
    ) {
      return 0;
    }

    let mesFinal =
      mesSelecionado;

    const [
      anoSelecionado,
      mesSelecionadoNumero
    ] =
      mesSelecionado
        .split('-')
        .map(Number);

    const dataMesAnterior =
      new Date(
        anoSelecionado,
        mesSelecionadoNumero - 2,
        1
      );

    mesFinal =
      `${dataMesAnterior.getFullYear()}-${String(
        dataMesAnterior.getMonth() + 1
      ).padStart(2, '0')}`;

    if (
      lancamento.dataFim
    ) {
      const mesFim =
        lancamento.dataFim
          .slice(
            0,
            7
          );

      if (
        indiceMes(
          mesFim
        ) <
        indiceMes(
          mesFinal
        )
      ) {
        mesFinal =
          mesFim;
      }
    }

    if (
      indiceMes(
        mesFinal
      ) <
      indiceMes(
        mesInicio
      )
    ) {
      return 0;
    }

    const quantidadeMeses =
      quantidadeMesesInclusivos(
        mesInicio,
        mesFinal
      );

    return (
      sinal *
      lancamento.valor *
      quantidadeMeses
    );
  }

  if (
    lancamento.parcelado &&
    lancamento.primeiraParcela &&
    lancamento.quantidadeParcelas &&
    lancamento.parcelaAtual
  ) {
    const mesPrimeiraParcela =
      lancamento.primeiraParcela
        .slice(
          0,
          7
        );

    const mesesAntes =
      indiceMes(
        mesSelecionado
      ) -
      indiceMes(
        mesPrimeiraParcela
      );

    if (
      mesesAntes <= 0
    ) {
      return 0;
    }

    const parcelasRestantes =
      lancamento.quantidadeParcelas -
      lancamento.parcelaAtual +
      1;

    const parcelasAntesDoMes =
      Math.min(
        mesesAntes,
        parcelasRestantes
      );

    if (
      parcelasAntesDoMes <= 0
    ) {
      return 0;
    }

    return (
      sinal *
      lancamento.valor *
      parcelasAntesDoMes
    );
  }

  const mesLancamento =
    mesDoLancamentoUnico(
      lancamento.data
    );

  if (
    !mesLancamento ||
    indiceMes(
      mesLancamento
    ) >=
      indiceMes(
        mesSelecionado
      )
  ) {
    return 0;
  }

  return (
    sinal *
    lancamento.valor
  );
}

export function calcularSaldoAnterior(
  lancamentos: Lancamento[],
  movimentacoesInvestimento:
    MovimentacaoInvestimento[],
  mesSelecionado: string
) {
  const saldoLancamentos =
    lancamentos.reduce(
      (
        total,
        lancamento
      ) =>
        total +
        contribuicaoLancamentoAntesDoMes(
          lancamento,
          mesSelecionado
        ),
      0
    );

  const saldoInvestimentos =
    movimentacoesInvestimento
      .filter(
        (
          movimentacao
        ) =>
          movimentacao.data
            .slice(
              0,
              7
            ) <
          mesSelecionado
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

  return (
    saldoLancamentos +
    saldoInvestimentos
  );
}

export function nomeMesAnterior(
  mesSelecionado: string
) {
  const [
    ano,
    mes
  ] =
    mesSelecionado
      .split('-')
      .map(Number);

  const data =
    new Date(
      ano,
      mes - 2,
      1
    );

  return data
    .toLocaleDateString(
      'pt-BR',
      {
        month: 'long'
      }
    )
    .replace(
      /^./,
      (
        primeiraLetra
      ) =>
        primeiraLetra
          .toUpperCase()
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
