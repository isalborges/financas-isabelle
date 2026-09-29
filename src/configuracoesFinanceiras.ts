export type CaixinhaConfiguracao = {
  id: string;
  nome: string;
  percentualSalario:
    number | null;
  protegida?: boolean;
};

export type ConfiguracoesFinanceiras = {
  categorias: string[];
  caixinhas:
    CaixinhaConfiguracao[];
  formasPagamento: string[];
};

export const CONFIGURACOES_PADRAO:
  ConfiguracoesFinanceiras = {
  categorias: [
    'Alimentação',
    'Moradia',
    'Transporte',
    'Lazer',
    'Saúde',
    'Educação',
    'Salário',
    'Outros'
  ],

  formasPagamento: [
    'PIX',
    'Crédito',
    'Débito'
  ],

  caixinhas: [
    {
      id: 'renda-fixa',
      nome: 'Renda fixa',
      percentualSalario: 30,
      protegida: true
    },
    {
      id: 'ferias',
      nome: 'Férias',
      percentualSalario: null,
      protegida: true
    }
  ]
};

export function copiarConfiguracoesPadrao():
  ConfiguracoesFinanceiras {
  return {
    categorias: [
      ...CONFIGURACOES_PADRAO
        .categorias
    ],
    caixinhas:
      CONFIGURACOES_PADRAO
        .caixinhas
        .map(
          (caixinha) => ({
            ...caixinha
          })
        ),
    formasPagamento: [
      ...CONFIGURACOES_PADRAO
        .formasPagamento
    ]
  };
}

export function criarIdCaixinha(
  nome: string
) {
  const base =
    nome
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      );

  return (
    `${base}-${Date.now()}`
  );
}
