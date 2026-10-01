import {

  useCallback,

  useEffect,

  useState

} from 'react';

import type {

  Lancamento,

  FormaPagamento

} from '../../App';

import type {
  ConfiguracoesFinanceiras
} from '../../configuracoesFinanceiras';

import SeletorMes from '../SeletorMes/SeletorMes';

import {
  confirmarAcao,
  notificar
} from '../../lib/feedback';

type LancamentosProps = {

  lancamentos: Lancamento[];

  userId:
    string;

  configuracoes:
    ConfiguracoesFinanceiras;

  mesSelecionado: string;

  mesAnterior: () => void;

  proximoMes: () => void;

  selecionarMes:

  (mes: string) => void;

  adicionarLancamento:

    (lancamento: Lancamento) => Promise<boolean>;

  editarLancamento:

    (lancamento: Lancamento) => Promise<boolean>;

  excluirLancamento:

    (id: number) => Promise<boolean>;

  lancamentoParaEditar:

    number | null;

  limparLancamentoParaEditar:

    () => void;

};

type ErrosFormulario = {

  descricao?: string;

  valor?: string;

  data?: string;

  dataInicio?: string;

  dataFim?: string;

  valorTotal?: string;

  quantidadeParcelas?: string;

  parcelaAtual?: string;

  primeiraParcela?: string;

};

function Lancamentos({

  lancamentos,

  userId,

  configuracoes,

  mesSelecionado,

  mesAnterior,

  proximoMes,

  selecionarMes,

  adicionarLancamento,

  editarLancamento,

  excluirLancamento,

  lancamentoParaEditar,

  limparLancamentoParaEditar

}: LancamentosProps) {

  const chaveRascunhoLancamento =
    `controle-financeiro-rascunho-lancamento-${userId}`;

  const [

    mostrarFormulario,

    setMostrarFormulario

  ] =

    useState(false);

  const [

    lancamentoEditando,

    setLancamentoEditando

  ] =

    useState<Lancamento | null>(

      null

    );

  const [

    salvandoLancamento,

    setSalvandoLancamento

  ] =

    useState(false);

  const [

    excluindoLancamentoId,

    setExcluindoLancamentoId

  ] =

    useState<number | null>(null);

  const [

    data,

    setData

  ] =

    useState('');

  const [

    descricao,

    setDescricao

  ] =

    useState('');

  const [

    valor,

    setValor

  ] =

    useState('');

  const [

    categoria,

    setCategoria

  ] =

    useState(
      configuracoes.categorias[0] ??
        'Alimentação'
    );

  const [

    tipo,

    setTipo

  ] =

    useState<

      'Entrada' |

      'Saída'

    >(

      'Saída'

    );

  const [

    formaPagamento,

    setFormaPagamento

  ] =

    useState<FormaPagamento>(

      'PIX'

    );

  const [

    tipoLancamento,

    setTipoLancamento

  ] =

    useState<

      'unico' |

      'recorrente' |

      'parcelado'

    >(

      'unico'

    );

  const [

    dataInicio,

    setDataInicio

  ] =

    useState('');

  const [

    dataFim,

    setDataFim

  ] =

    useState('');

  const [

    valorTotal,

    setValorTotal

  ] =

    useState('');

  const [

    quantidadeParcelas,

    setQuantidadeParcelas

  ] =

    useState('');

  const [

    parcelaAtual,

    setParcelaAtual

  ] =

    useState('1');

  const [

    primeiraParcela,

    setPrimeiraParcela

  ] =

    useState('');

  const [

    erros,

    setErros

  ] =

    useState<ErrosFormulario>(

      {}

    );

  function limparErro(

    campo: keyof ErrosFormulario

  ) {

    setErros(

      (errosAtuais) => {

        const novosErros = {

          ...errosAtuais

        };

        delete novosErros[

          campo

        ];

        return novosErros;

      }

    );

  }

  function recorrenciaAtivaNoMes(

    lancamento: Lancamento

  ) {

    if (

      !lancamento.recorrente ||

      !lancamento.dataInicio

    ) {

      return false;

    }

    const inicio =

      lancamento.dataInicio

        .slice(

          0,

          7

        );

    const fim =

      lancamento.dataFim

        ? lancamento.dataFim

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

    lancamento: Lancamento

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

  function dataDaParcela(

    lancamento: Lancamento

  ) {

    if (

      !lancamento.primeiraParcela

    ) {

      return lancamento.data;

    }

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

  function dataDaRecorrencia(

    lancamento: Lancamento

  ) {

    if (

      !lancamento.dataInicio

    ) {

      return lancamento.data;

    }

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

  function dataVisivel(

    lancamento: Lancamento

  ) {

    if (

      lancamento.parcelado

    ) {

      return dataDaParcela(

        lancamento

      );

    }

    if (

      lancamento.recorrente

    ) {

      return dataDaRecorrencia(

        lancamento

      );

    }

    return lancamento.data;

  }

  function dataParaNumero(

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

    if (

      !dia ||

      !mes ||

      !ano

    ) {

      return 0;

    }

    return new Date(

      ano,

      mes - 1,

      dia

    ).getTime();

  }

  const lancamentosDoMes =

    lancamentos.filter(

      (lancamento) => {

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

          partes.length !== 3

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

  function estaPago(

    lancamento: Lancamento

  ) {

    if (

      lancamento.tipo !==

      'Saída'

    ) {

      return true;

    }

    const parcelaNoCredito =
      lancamento.parcelado &&
      (
        lancamento.formaPagamento ===
          'Crédito' ||
        lancamento.formaPagamento ===
          'Cartão'
      );

    if (

      (
        lancamento.parcelado &&
        !parcelaNoCredito
      ) ||

      lancamento.formaPagamento ===

        'PIX'

    ) {

      return Boolean(

        lancamento

          .pagamentosPorMes?.[

            mesSelecionado

          ]

      );

    }

    return true;

  }

  const contasFixas =
    lancamentosDoMes
      .filter(
        (lancamento) =>
          lancamento.recorrente &&
          !lancamento.parcelado &&
          lancamento.tipo === 'Saída'
      )
      .sort(
        (primeiro, segundo) =>
          dataParaNumero(dataVisivel(primeiro)) -
          dataParaNumero(dataVisivel(segundo))
      );

  const totalContasFixas =
    contasFixas.reduce(
      (total, lancamento) =>
        total + lancamento.valor,
      0
    );

  const lancamentosParcelados =
    lancamentosDoMes
      .filter(
        (lancamento) =>
          lancamento.parcelado &&
          lancamento.tipo === 'Saída'
      )
      .sort((primeiro, segundo) => {
        const primeiroPago = estaPago(primeiro);
        const segundoPago = estaPago(segundo);

        if (primeiroPago !== segundoPago) {
          return primeiroPago ? 1 : -1;
        }

        return (
          dataParaNumero(dataVisivel(primeiro)) -
          dataParaNumero(dataVisivel(segundo))
        );
      });

  const totalParcelados =
    lancamentosParcelados.reduce(
      (total, lancamento) =>
        total + lancamento.valor,
      0
    );

  const entradasDoMes =
    lancamentosDoMes
      .filter(
        (lancamento) =>
          lancamento.tipo === 'Entrada'
      )
      .sort(
        (primeiro, segundo) =>
          dataParaNumero(dataVisivel(primeiro)) -
          dataParaNumero(dataVisivel(segundo))
      );

  const totalEntradas =
    entradasDoMes.reduce(
      (total, lancamento) =>
        total + lancamento.valor,
      0
    );

  const gastosDoMes =
    lancamentosDoMes
      .filter(
        (lancamento) =>
          lancamento.tipo === 'Saída' &&
          !lancamento.parcelado &&
          !lancamento.recorrente
      )
      .sort(
        (primeiro, segundo) =>
          dataParaNumero(dataVisivel(primeiro)) -
          dataParaNumero(dataVisivel(segundo))
      );

  const totalGastosDoMes =
    gastosDoMes.reduce(
      (total, lancamento) =>
        total + lancamento.valor,
      0
    );

  function limparFormulario() {

    localStorage.removeItem(
      chaveRascunhoLancamento
    );

    setData('');

    setDescricao('');

    setValor('');

    setCategoria(
      configuracoes.categorias[0] ??
        'Alimentação'
    );

    setTipo(

      'Saída'

    );

    setFormaPagamento(

      'PIX'

    );

    setTipoLancamento(

      'unico'

    );

    setDataInicio('');

    setDataFim('');

    setValorTotal('');

    setQuantidadeParcelas('');

    setParcelaAtual(

      '1'

    );

    setPrimeiraParcela('');

    setErros({});

    setMostrarFormulario(

      false

    );

    setLancamentoEditando(

      null

    );

  }

  function abrirNovoLancamento() {

    limparFormulario();

    setMostrarFormulario(

      true

    );

  }

  const abrirEdicao = useCallback((

    lancamento: Lancamento

  ) => {

    localStorage.removeItem(
      chaveRascunhoLancamento
    );

    setErros({});

    setLancamentoEditando(

      lancamento

    );

    setDescricao(

      lancamento.descricao

    );

    setCategoria(

      lancamento.categoria

    );

    setTipo(

      lancamento.tipo

    );

    setFormaPagamento(

      lancamento.formaPagamento ??

      'Outro'

    );

    if (

      lancamento.parcelado

    ) {

      setTipoLancamento(

        'parcelado'

      );

      setValorTotal(

        (

          lancamento.valorTotal ??

          lancamento.valor *

          (

            lancamento

              .quantidadeParcelas ??

            1

          )

        ).toString()

      );

      setQuantidadeParcelas(

        (

          lancamento

            .quantidadeParcelas ??

          1

        ).toString()

      );

      setParcelaAtual(

        (

          lancamento

            .parcelaAtual ??

          1

        ).toString()

      );

      setPrimeiraParcela(

        lancamento

          .primeiraParcela ??

        ''

      );

      setValor(

        lancamento.valor

          .toString()

      );

    }

    else if (

      lancamento.recorrente

    ) {

      setTipoLancamento(

        'recorrente'

      );

      setDataInicio(

        lancamento.dataInicio ??

        ''

      );

      setDataFim(

        lancamento.dataFim ??

        ''

      );

      setValor(

        lancamento.valor

          .toString()

      );

    }

    else {

      setTipoLancamento(

        'unico'

      );

      const [

        dia,

        mes,

        ano

      ] =

        lancamento.data

          .split('/');

      setData(

        `${ano}-${mes}-${dia}`

      );

      setValor(

        lancamento.valor

          .toString()

      );

    }

    setMostrarFormulario(

      true

    );

  }, [
    chaveRascunhoLancamento
  ]);

  useEffect(() => {

    if (
      lancamentoParaEditar ===
      null
    ) {

      return;

    }

    const lancamentoEncontrado =
      lancamentos.find(
        (lancamento) =>
          lancamento.id ===
          lancamentoParaEditar
      );

    if (
      !lancamentoEncontrado
    ) {

      limparLancamentoParaEditar();

      return;

    }

    const temporizador =
      window.setTimeout(
        () => {

          abrirEdicao(
            lancamentoEncontrado
          );

          limparLancamentoParaEditar();

        },
        0
      );

    return () => {

      window.clearTimeout(
        temporizador
      );

    };

  }, [
    lancamentoParaEditar,
    lancamentos,
    abrirEdicao,
    limparLancamentoParaEditar
  ]);

  useEffect(
    () => {
      if (
        lancamentoParaEditar !==
        null
      ) {
        return;
      }

      const rascunho =
        localStorage.getItem(
          chaveRascunhoLancamento
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
            lancamentoEditandoId?: number | null;
            data?: string;
            descricao?: string;
            valor?: string;
            categoria?: string;
            tipo?: 'Entrada' | 'Saída';
            formaPagamento?: FormaPagamento;
            tipoLancamento?: 'unico' | 'recorrente' | 'parcelado';
            dataInicio?: string;
            dataFim?: string;
            valorTotal?: string;
            quantidadeParcelas?: string;
            parcelaAtual?: string;
            primeiraParcela?: string;
          };

        if (
          !dados.aberto
        ) {
          return;
        }

        const editando =
          dados.lancamentoEditandoId
            ? lancamentos.find(
                (
                  lancamento
                ) =>
                  lancamento.id ===
                  dados.lancamentoEditandoId
              ) ?? null
            : null;

        setLancamentoEditando(
          editando
        );

        setData(
          dados.data ??
            ''
        );

        setDescricao(
          dados.descricao ??
            ''
        );

        setValor(
          dados.valor ??
            ''
        );

        setCategoria(
          dados.categoria ??
            configuracoes.categorias[0] ??
            'Alimentação'
        );

        setTipo(
          dados.tipo ??
            'Saída'
        );

        setFormaPagamento(
          dados.formaPagamento ??
            'PIX'
        );

        setTipoLancamento(
          dados.tipoLancamento ??
            'unico'
        );

        setDataInicio(
          dados.dataInicio ??
            ''
        );

        setDataFim(
          dados.dataFim ??
            ''
        );

        setValorTotal(
          dados.valorTotal ??
            ''
        );

        setQuantidadeParcelas(
          dados.quantidadeParcelas ??
            ''
        );

        setParcelaAtual(
          dados.parcelaAtual ??
            '1'
        );

        setPrimeiraParcela(
          dados.primeiraParcela ??
            ''
        );

        setMostrarFormulario(
          true
        );
      }
      catch {
        localStorage.removeItem(
          chaveRascunhoLancamento
        );
      }
    },
    [
      chaveRascunhoLancamento,
      configuracoes.categorias,
      lancamentos,
      lancamentoParaEditar
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
        chaveRascunhoLancamento,
        JSON.stringify({
          aberto:
            true,
          lancamentoEditandoId:
            lancamentoEditando?.id ??
            null,
          data,
          descricao,
          valor,
          categoria,
          tipo,
          formaPagamento,
          tipoLancamento,
          dataInicio,
          dataFim,
          valorTotal,
          quantidadeParcelas,
          parcelaAtual,
          primeiraParcela
        })
      );
    },
    [
      mostrarFormulario,
      lancamentoEditando,
      data,
      descricao,
      valor,
      categoria,
      tipo,
      formaPagamento,
      tipoLancamento,
      dataInicio,
      dataFim,
      valorTotal,
      quantidadeParcelas,
      parcelaAtual,
      primeiraParcela,
      chaveRascunhoLancamento
    ]
  );

  function validarFormulario() {

    const novosErros:

      ErrosFormulario = {};

    if (

      !descricao.trim()

    ) {

      novosErros.descricao =

        'Informe uma descrição.';

    }

    if (

      tipoLancamento ===

      'unico'

    ) {

      if (!valor) {

        novosErros.valor =

          'Informe o valor.';

      }

      else if (

        Number(valor) <= 0

      ) {

        novosErros.valor =

          'O valor deve ser maior que zero.';

      }

      if (!data) {

        novosErros.data =

          'Informe a data do lançamento.';

      }

    }

    if (

      tipoLancamento ===

      'recorrente'

    ) {

      if (!valor) {

        novosErros.valor =

          'Informe o valor.';

      }

      else if (

        Number(valor) <= 0

      ) {

        novosErros.valor =

          'O valor deve ser maior que zero.';

      }

      if (!dataInicio) {

        novosErros.dataInicio =

          'Informe a data de início.';

      }

      if (

        dataInicio &&

        dataFim &&

        dataFim <

        dataInicio

      ) {

        novosErros.dataFim =

          'A data final não pode ser anterior ao início.';

      }

    }

    if (

      tipoLancamento ===

      'parcelado'

    ) {

      if (!valorTotal) {

        novosErros.valorTotal =

          'Informe o valor total.';

      }

      else if (

        Number(valorTotal) <= 0

      ) {

        novosErros.valorTotal =

          'O valor total deve ser maior que zero.';

      }

      if (

        !quantidadeParcelas

      ) {

        novosErros.quantidadeParcelas =

          'Informe a quantidade de parcelas.';

      }

      else if (

        Number(

          quantidadeParcelas

        ) <= 0

      ) {

        novosErros.quantidadeParcelas =

          'A quantidade deve ser maior que zero.';

      }

      if (

        !parcelaAtual

      ) {

        novosErros.parcelaAtual =

          'Informe a parcela atual.';

      }

      else if (

        Number(

          parcelaAtual

        ) <= 0

      ) {

        novosErros.parcelaAtual =

          'A parcela atual deve ser maior que zero.';

      }

      else if (

        quantidadeParcelas &&

        Number(

          parcelaAtual

        ) >

        Number(

          quantidadeParcelas

        )

      ) {

        novosErros.parcelaAtual =

          'A parcela atual não pode ser maior que o total.';

      }

      if (

        !primeiraParcela

      ) {

        novosErros.primeiraParcela =

          'Informe a data da primeira parcela.';

      }

    }

    setErros(

      novosErros

    );

    return (

      Object.keys(

        novosErros

      ).length === 0

    );

  }

  async function salvarLancamento() {

    if (

      salvandoLancamento ||
      !validarFormulario()

    ) {

      return;

    }

    setSalvandoLancamento(
      true
    );

    try {
      let novoLancamento:
        Lancamento;

      if (
        tipoLancamento ===
        'unico'
      ) {
        novoLancamento = {
          id:
            lancamentoEditando
              ? lancamentoEditando.id
              : Date.now(),
          data:
            new Date(
              `${data}T12:00:00`
            ).toLocaleDateString(
              'pt-BR'
            ),
          descricao,
          categoria,
          tipo,
          formaPagamento:
            tipo === 'Saída'
              ? formaPagamento
              : undefined,
          pagamentosPorMes:
            lancamentoEditando
              ?.pagamentosPorMes,
          valor:
            Number(valor),
          recorrente:
            false,
          parcelado:
            false
        };
      }
      else if (
        tipoLancamento ===
        'recorrente'
      ) {
        novoLancamento = {
          id:
            lancamentoEditando
              ? lancamentoEditando.id
              : Date.now(),
          data:
            new Date(
              `${dataInicio}T12:00:00`
            ).toLocaleDateString(
              'pt-BR'
            ),
          descricao,
          categoria,
          tipo,
          formaPagamento:
            tipo === 'Saída'
              ? formaPagamento
              : undefined,
          pagamentosPorMes:
            lancamentoEditando
              ?.pagamentosPorMes,
          valor:
            Number(valor),
          recorrente:
            true,
          parcelado:
            false,
          frequencia:
            'mensal',
          dataInicio,
          dataFim:
            dataFim ||
            undefined
        };
      }
      else {
        const total =
          Number(
            valorTotal
          );

        const quantidade =
          Number(
            quantidadeParcelas
          );

        const atual =
          Number(
            parcelaAtual
          );

        const valorParcela =
          Number(
            (
              total /
              quantidade
            ).toFixed(
              2
            )
          );

        novoLancamento = {
          id:
            lancamentoEditando
              ? lancamentoEditando.id
              : Date.now(),
          data:
            new Date(
              `${primeiraParcela}T12:00:00`
            ).toLocaleDateString(
              'pt-BR'
            ),
          descricao,
          categoria,
          tipo,
          formaPagamento:
            tipo === 'Saída'
              ? formaPagamento
              : undefined,
          pagamentosPorMes:
            lancamentoEditando
              ?.pagamentosPorMes,
          valor:
            valorParcela,
          parcelado:
            true,
          recorrente:
            false,
          valorTotal:
            total,
          quantidadeParcelas:
            quantidade,
          parcelaAtual:
            atual,
          primeiraParcela
        };
      }

      const estavaEditando =
        Boolean(
          lancamentoEditando
        );

      const sucesso =
        lancamentoEditando
          ? await editarLancamento(
              novoLancamento
            )
          : await adicionarLancamento(
              novoLancamento
            );

      if (
        !sucesso
      ) {
        return;
      }

      notificar(
        estavaEditando
          ? 'Lançamento atualizado com sucesso.'
          : 'Lançamento adicionado com sucesso.',
        'sucesso'
      );

      limparFormulario();
    }
    finally {
      setSalvandoLancamento(
        false
      );
    }

  }

  function alternarPagamento(

    lancamento: Lancamento

  ) {

    if (

      lancamento.tipo !==

      'Saída'

    ) {

      return;

    }

    const parcelaNoCredito =
      lancamento.parcelado &&
      (
        lancamento.formaPagamento ===
          'Crédito' ||
        lancamento.formaPagamento ===
          'Cartão'
      );

    if (
      parcelaNoCredito ||
      (
        !lancamento.parcelado &&
        lancamento.formaPagamento !==
          'PIX'
      )
    ) {

      return;

    }

    const pagamentosAtuais = {

      ...(

        lancamento

          .pagamentosPorMes ??

        {}

      )

    };

    const pagoAtualmente =

      Boolean(

        pagamentosAtuais[

          mesSelecionado

        ]

      );

    pagamentosAtuais[

      mesSelecionado

    ] =

      !pagoAtualmente;

    editarLancamento({

      ...lancamento,

      pagamentosPorMes:

        pagamentosAtuais

    });

  }

  async function removerLancamento(

    id: number

  ) {

    if (
      excluindoLancamentoId !==
      null
    ) {
      return;
    }

    const confirmar =
      await confirmarAcao({
        titulo:
          'Excluir lançamento?',
        mensagem:
          'Esse lançamento será removido das suas finanças.',
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

    setExcluindoLancamentoId(
      id
    );

    try {
      const sucesso =
        await excluirLancamento(
          id
        );

      if (
        sucesso
      ) {
        notificar(
          'Lançamento excluído com sucesso.',
          'sucesso'
        );
      }
    }
    finally {
      setExcluindoLancamentoId(
        null
      );
    }

  }

  function formatarValor(

    valor: number

  ) {

    return valor.toLocaleString(

      'pt-BR',

      {

        style: 'currency',

        currency: 'BRL'

      }

    );

  }

  const valorParcelaCalculado =

    valorTotal &&

    quantidadeParcelas &&

    Number(

      quantidadeParcelas

    ) > 0

      ? Number(

          (

            Number(

              valorTotal

            ) /

            Number(

              quantidadeParcelas

            )

          ).toFixed(

            2

          )

        )

      : 0;

  function renderizarLinha(

    lancamento: Lancamento

  ) {

    const parcela =

      lancamento.parcelado

        ? parcelaDoMes(

            lancamento

          )

        : null;

    const pago =

      estaPago(

        lancamento

      );

    const parcelaNoCredito =
      lancamento.parcelado &&
      (
        lancamento.formaPagamento ===
          'Crédito' ||
        lancamento.formaPagamento ===
          'Cartão'
      );

    const statusManual =

      lancamento.tipo ===

        'Saída' &&

      (

        (
          lancamento.parcelado &&
          !parcelaNoCredito
        ) ||

        lancamento.formaPagamento ===

          'PIX'

      );

    return (

      <tr

        key={

          lancamento.id

        }

        className={

          `linha-lancamento ${

            statusManual &&

            !pago

              ? 'linha-pendente'

              : ''

          }`

        }

        onClick={() =>

          abrirEdicao(

            lancamento

          )

        }

      >

        <td>

          {dataVisivel(

            lancamento

          )}

        </td>

        <td>

          {lancamento.descricao}

          {lancamento.recorrente && (

            <span className="badge-recorrente">

              Recorrente

            </span>

          )}

          {lancamento.parcelado && (

            <span className="badge-parcelado">

              {parcela}/

              {

                lancamento

                  .quantidadeParcelas

              }

            </span>

          )}

        </td>

        <td>

          {lancamento.categoria}

        </td>

        <td>

          {lancamento.tipo ===

            'Saída'

            ? (

                lancamento

                  .formaPagamento ??

                'Não informado'

              )

            : '—'

          }

        </td>

        <td

          className={

            lancamento.tipo ===

            'Entrada'

              ? 'entrada'

              : 'saida'

          }

        >

          {lancamento.tipo}

        </td>

        <td>

          {lancamento.tipo ===

            'Entrada' ? (

            <span className="status-neutro">

              —

            </span>

          )

          : statusManual ? (

            <button

              className={

                pago

                  ? 'btn-status status-pago'

                  : 'btn-status status-pendente'

              }

              onClick={(e) => {

                e.stopPropagation();

                alternarPagamento(

                  lancamento

                );

              }}

            >

              {pago

                ? '✓ Pago'

                : 'Pendente'

              }

            </button>

          )

          : (

            <span className="status-automatico">

              Automático

            </span>

          )}

        </td>

        <td>

          {formatarValor(

            lancamento.valor

          )}

        </td>

        <td>

          <button

            className="btn-excluir"

            onClick={(e) => {

              e.stopPropagation();

              removerLancamento(

                lancamento.id

              );

            }}

            title="Excluir lançamento"

            disabled={
              excluindoLancamentoId ===
              lancamento.id
            }

          >

            {excluindoLancamentoId ===
              lancamento.id
              ? '…'
              : '×'
            }

          </button>

        </td>

      </tr>

    );

  }

  function renderizarTabela(

    lista: Lancamento[]

  ) {

    if (

      lista.length === 0

    ) {

      return (

        <div className="sem-lancamentos pequeno">

          <p>

            Nenhum lançamento nesta seção.

          </p>

        </div>

      );

    }

    return (

      <div className="tabela-container">

        <table>

          <thead>

            <tr>

              <th>

                Data

              </th>

              <th>

                Descrição

              </th>

              <th>

                Categoria

              </th>

              <th>

                Pagamento

              </th>

              <th>

                Tipo

              </th>

              <th>

                Status

              </th>

              <th>

                Valor

              </th>

              <th>

              </th>

            </tr>

          </thead>

          <tbody>

            {lista.map(

              (

                lancamento

              ) =>

                renderizarLinha(

                  lancamento

                )

            )}

          </tbody>

        </table>

      </div>

    );

  }

  return (

    <section className="page">

    <SeletorMes

      mesSelecionado={mesSelecionado}

      mesAnterior={mesAnterior}

      proximoMes={proximoMes}

      selecionarMes={selecionarMes}

    />

    {mostrarFormulario && (

        <div
          className="modal-overlay"
          onMouseDown={() => {
            if (
              !salvandoLancamento
            ) {
              limparFormulario();
            }
          }}
        >

          <section
            className="card formulario modal-card modal-card-grande"
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >

            <div className="modal-topo">

              <div>

          <h2>
                  {lancamentoEditando
                    ? 'Editar movimentação'
                    : 'Nova movimentação'
                  }
                </h2>

              </div>

              <button
                type="button"
                className="modal-fechar"
                onClick={limparFormulario}
                disabled={
                  salvandoLancamento
                }
              >
                ×
              </button>

            </div>

          {Object.keys(

            erros

          ).length > 0 && (

            <div className="alerta-formulario">

              <strong>

                Falta preencher algumas informações.

              </strong>

              <span>

                Confira os campos destacados em vermelho.

              </span>

            </div>

          )}

          <div className="form-grid">

            <div className="campo">

              <label>

                Tipo de lançamento

              </label>

              <select

                value={

                  tipoLancamento

                }

                onChange={(e) => {

                  const valorSelecionado =

                    e.target.value;

                  setErros({});

                  if (

                    valorSelecionado ===

                    'recorrente'

                  ) {

                    setTipoLancamento(

                      'recorrente'

                    );

                  }

                  else if (

                    valorSelecionado ===

                    'parcelado'

                  ) {

                    setTipoLancamento(

                      'parcelado'

                    );

                  }

                  else {

                    setTipoLancamento(

                      'unico'

                    );

                  }

                }}

              >

                <option value="unico">

                  Único

                </option>

                <option value="recorrente">

                  Recorrente

                </option>

                <option value="parcelado">

                  Parcelado

                </option>

              </select>

            </div>

            <div className="campo">

              <label>

                Tipo

              </label>

              <select

                value={

                  tipo

                }

                onChange={(e) =>

                  setTipo(

                    e.target.value ===

                    'Entrada'

                      ? 'Entrada'

                      : 'Saída'

                  )

                }

              >

                <option value="Saída">

                  Saída

                </option>

                <option value="Entrada">

                  Entrada

                </option>

              </select>

            </div>

            <div

              className={

                `campo ${

                  erros.descricao

                    ? 'campo-com-erro'

                    : ''

                }`

              }

            >

              <label>

                Descrição

              </label>

              <input

                type="text"

                placeholder="Ex: Academia"

                value={

                  descricao

                }

                onChange={(e) => {

                  setDescricao(

                    e.target.value

                  );

                  limparErro(

                    'descricao'

                  );

                }}

              />

              {erros.descricao && (

                <span className="mensagem-erro">

                  {erros.descricao}

                </span>

              )}

            </div>

            <div className="campo">

              <label>

                Categoria

              </label>

              <select
                value={categoria}
                onChange={(e) =>
                  setCategoria(
                    e.target.value
                  )
                }
              >
                {configuracoes.categorias.map(
                  (categoriaDisponivel) => (
                    <option
                      key={categoriaDisponivel}
                      value={categoriaDisponivel}
                    >
                      {categoriaDisponivel}
                    </option>
                  )
                )}
              </select>

            </div>

            {tipo === 'Saída' && (

              <div className="campo">

                <label>

                  Forma de pagamento

                </label>

                <select
                  value={
                    formaPagamento
                  }
                  onChange={(e) =>
                    setFormaPagamento(
                      e.target.value
                    )
                  }
                >
                  {formaPagamento ===
                    'Cartão' &&
                    !configuracoes.formasPagamento.includes(
                      'Cartão'
                    ) && (
                    <option value="Cartão">
                      Cartão (lançamento antigo)
                    </option>
                  )}

                  {configuracoes.formasPagamento.map(
                    (formaDisponivel) => (
                      <option
                        key={formaDisponivel}
                        value={formaDisponivel}
                      >
                        {formaDisponivel}
                      </option>
                    )
                  )}
                </select>

              </div>

            )}

            {tipoLancamento !==

              'parcelado' && (

              <div

                className={

                  `campo ${

                    erros.valor

                      ? 'campo-com-erro'

                      : ''

                  }`

                }

              >

                <label>

                  Valor

                </label>

                <input

                  type="number"

                  placeholder="0,00"

                  value={

                    valor

                  }

                  onChange={(e) => {

                    setValor(

                      e.target.value

                    );

                    limparErro(

                      'valor'

                    );

                  }}

                />

                {erros.valor && (

                  <span className="mensagem-erro">

                    {erros.valor}

                  </span>

                )}

              </div>

            )}

            {tipoLancamento ===

              'parcelado' && (

              <>

                <div

                  className={

                    `campo ${

                      erros.valorTotal

                        ? 'campo-com-erro'

                        : ''

                    }`

                  }

                >

                  <label>

                    Valor total

                  </label>

                  <input

                    type="number"

                    placeholder="0,00"

                    value={

                      valorTotal

                    }

                    onChange={(e) => {

                      setValorTotal(

                        e.target.value

                      );

                      limparErro(

                        'valorTotal'

                      );

                    }}

                  />

                  {erros.valorTotal && (

                    <span className="mensagem-erro">

                      {erros.valorTotal}

                    </span>

                  )}

                </div>

                <div

                  className={

                    `campo ${

                      erros.quantidadeParcelas

                        ? 'campo-com-erro'

                        : ''

                    }`

                  }

                >

                  <label>

                    Quantidade de parcelas

                  </label>

                  <input

                    type="number"

                    min="1"

                    value={

                      quantidadeParcelas

                    }

                    onChange={(e) => {

                      setQuantidadeParcelas(

                        e.target.value

                      );

                      limparErro(

                        'quantidadeParcelas'

                      );

                      limparErro(

                        'parcelaAtual'

                      );

                    }}

                  />

                  {erros.quantidadeParcelas && (

                    <span className="mensagem-erro">

                      {erros.quantidadeParcelas}

                    </span>

                  )}

                </div>

                <div

                  className={

                    `campo ${

                      erros.parcelaAtual

                        ? 'campo-com-erro'

                        : ''

                    }`

                  }

                >

                  <label>

                    Parcela atual

                  </label>

                  <input

                    type="number"

                    min="1"

                    value={

                      parcelaAtual

                    }

                    onChange={(e) => {

                      setParcelaAtual(

                        e.target.value

                      );

                      limparErro(

                        'parcelaAtual'

                      );

                    }}

                  />

                  {erros.parcelaAtual && (

                    <span className="mensagem-erro">

                      {erros.parcelaAtual}

                    </span>

                  )}

                </div>

              </>

            )}

            {tipoLancamento ===

              'unico' && (

              <div

                className={

                  `campo ${

                    erros.data

                      ? 'campo-com-erro'

                      : ''

                  }`

                }

              >

                <label>

                  Data

                </label>

                <input

                  type="date"

                  value={

                    data

                  }

                  onChange={(e) => {

                    setData(

                      e.target.value

                    );

                    limparErro(

                      'data'

                    );

                  }}

                />

                {erros.data && (

                  <span className="mensagem-erro">

                    {erros.data}

                  </span>

                )}

              </div>

            )}

            {tipoLancamento ===

              'recorrente' && (

              <>

                <div

                  className={

                    `campo ${

                      erros.dataInicio

                        ? 'campo-com-erro'

                        : ''

                    }`

                  }

                >

                  <label>

                    Início

                  </label>

                  <input

                    type="date"

                    value={

                      dataInicio

                    }

                    onChange={(e) => {

                      setDataInicio(

                        e.target.value

                      );

                      limparErro(

                        'dataInicio'

                      );

                      limparErro(

                        'dataFim'

                      );

                    }}

                  />

                  {erros.dataInicio && (

                    <span className="mensagem-erro">

                      {erros.dataInicio}

                    </span>

                  )}

                </div>

                <div

                  className={

                    `campo ${

                      erros.dataFim

                        ? 'campo-com-erro'

                        : ''

                    }`

                  }

                >

                  <label>

                    Fim

                    <span className="campo-opcional">

                      opcional

                    </span>

                  </label>

                  <input

                    type="date"

                    value={

                      dataFim

                    }

                    min={

                      dataInicio

                    }

                    onChange={(e) => {

                      setDataFim(

                        e.target.value

                      );

                      limparErro(

                        'dataFim'

                      );

                    }}

                  />

                  {erros.dataFim && (

                    <span className="mensagem-erro">

                      {erros.dataFim}

                    </span>

                  )}

                </div>

              </>

            )}

            {tipoLancamento ===

              'parcelado' && (

              <div

                className={

                  `campo ${

                    erros.primeiraParcela

                      ? 'campo-com-erro'

                      : ''

                  }`

                }

              >

                <label>

                  Data da primeira parcela

                </label>

                <input

                  type="date"

                  value={

                    primeiraParcela

                  }

                  onChange={(e) => {

                    setPrimeiraParcela(

                      e.target.value

                    );

                    limparErro(

                      'primeiraParcela'

                    );

                  }}

                />

                {erros.primeiraParcela && (

                  <span className="mensagem-erro">

                    {erros.primeiraParcela}

                  </span>

                )}

              </div>

            )}

          </div>

          {tipoLancamento ===

            'parcelado' && (

            <div className="recorrencia-info">

              <span>

                💳

              </span>

              <p>

                {valorParcelaCalculado > 0

                  ? `Cada parcela será de ${formatarValor(

                      valorParcelaCalculado

                    )}.`

                  : 'Informe o valor total e a quantidade de parcelas.'

                }

              </p>

            </div>

          )}

          {tipoLancamento ===

            'recorrente' && (

            <div className="recorrencia-info">

              <span>

                ↻

              </span>

              <p>

                Este lançamento será considerado

                automaticamente todos os meses

                dentro do período definido.

              </p>

            </div>

          )}

          <div className="form-actions">

            <button

              className="btn-secondary"

              onClick={

                limparFormulario

              }

              disabled={
                salvandoLancamento
              }

            >

              Cancelar

            </button>

            <button

              className="btn-primary"

              onClick={

                salvarLancamento

              }

              disabled={
                salvandoLancamento
              }

            >

              {salvandoLancamento

                ? lancamentoEditando

                  ? 'Atualizando...'

                  : 'Salvando...'

                : lancamentoEditando

                  ? 'Salvar alterações'

                  : 'Adicionar'

              }

            </button>

          </div>

        </section>

        </div>

      )}

      {/* ENTRADAS */}
      <div className="secao-lancamentos-bloco">
        <div className="secao-lancamentos-acao">
          <button
            type="button"
            className="btn-primary btn-nova-movimentacao-secao"
            onClick={
              abrirNovoLancamento
            }
          >
            + Nova movimentação
          </button>
        </div>

        <section
          className="card tabela secao-lancamentos"
          id="lancamentos-entradas"
        >
        <div className="secao-lancamentos-titulo">
          <div>
            <h2>Entradas do mês</h2>
            <p>
              Salários e outras entradas
              consideradas neste mês.
            </p>
          </div>

          <div className="secao-lancamentos-resumo">
            <strong className="total-secao total-entrada">
              {formatarValor(totalEntradas)}
            </strong>

            <span className="contador-secao entradas">
              {entradasDoMes.length}
            </span>
          </div>
        </div>

        {renderizarTabela(entradasDoMes)}
        </section>
      </div>

      {/* CONTAS FIXAS */}
      <div className="secao-lancamentos-bloco">
        <div className="secao-lancamentos-acao">
          <button
            type="button"
            className="btn-primary btn-nova-movimentacao-secao"
            onClick={
              abrirNovoLancamento
            }
          >
            + Nova movimentação
          </button>
        </div>

        <section
          className="card tabela secao-lancamentos"
          id="lancamentos-fixas"
        >
        <div className="secao-lancamentos-titulo">
          <div>
            <h2>Contas fixas</h2>
            <p>
              Despesas recorrentes como aluguel,
              assinaturas e mensalidades.
            </p>
          </div>

          <div className="secao-lancamentos-resumo">
            <strong className="total-secao">
              {formatarValor(totalContasFixas)}
            </strong>

            <span className="contador-secao fixas">
              {contasFixas.length}
            </span>
          </div>
        </div>

        {renderizarTabela(contasFixas)}
        </section>
      </div>

      {/* PARCELADOS */}
      <div className="secao-lancamentos-bloco">
        <div className="secao-lancamentos-acao">
          <button
            type="button"
            className="btn-primary btn-nova-movimentacao-secao"
            onClick={
              abrirNovoLancamento
            }
          >
            + Nova movimentação
          </button>
        </div>

        <section
          className="card tabela secao-lancamentos"
          id="lancamentos-parcelados"
        >
        <div className="secao-lancamentos-titulo">
          <div>
            <h2>Lançamentos parcelados</h2>
            <p>
              Compras parceladas do mês.
              Pendentes aparecem primeiro.
            </p>
          </div>

          <div className="secao-lancamentos-resumo">
            <strong className="total-secao">
              {formatarValor(totalParcelados)}
            </strong>

            <span className="contador-secao parcelado">
              {lancamentosParcelados.length}
            </span>
          </div>
        </div>

        {renderizarTabela(lancamentosParcelados)}
        </section>
      </div>

      {/* GASTOS */}
      <div className="secao-lancamentos-bloco">
        <div className="secao-lancamentos-acao">
          <button
            type="button"
            className="btn-primary btn-nova-movimentacao-secao"
            onClick={
              abrirNovoLancamento
            }
          >
            + Nova movimentação
          </button>
        </div>

        <section
          className="card tabela secao-lancamentos"
          id="lancamentos-gastos"
        >
        <div className="secao-lancamentos-titulo">
          <div>
            <h2>Gastos do mês</h2>
            <p>
              Gastos únicos do mês,
              sem contas fixas ou parcelas.
            </p>
          </div>

          <div className="secao-lancamentos-resumo">
            <strong className="total-secao">
              {formatarValor(totalGastosDoMes)}
            </strong>

            <span className="contador-secao">
              {gastosDoMes.length}
            </span>
          </div>
        </div>

        {renderizarTabela(gastosDoMes)}
        </section>
      </div>

    </section>
  );
}

export default Lancamentos;
