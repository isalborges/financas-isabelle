import './App.css';

import {
  useEffect,
  useState
} from 'react';

import type {
  Session
} from '@supabase/supabase-js';

import {
  supabase
} from './lib/supabase';

import Auth
  from './components/Auth/Auth';

import Sidebar
  from './components/Sidebar/Sidebar';

import Dashboard
  from './components/Dashboard/Dashboard';

import Lancamentos
  from './components/Lancamentos/Lancamentos';

import Investimentos
  from './components/Investimentos/Investimentos';

import Relatorios
  from './components/Relatorios/Relatorios';

import Configuracoes
  from './components/Configuracoes/Configuracoes';

import {
  copiarConfiguracoesPadrao
} from './configuracoesFinanceiras';

import type {
  ConfiguracoesFinanceiras
} from './configuracoesFinanceiras';

export type FormaPagamento =
  | 'PIX'
  | 'Cartão'
  | 'Débito'
  | 'Dinheiro'
  | 'Boleto'
  | 'Outro';

export type Lancamento = {
  id: number;

  data: string;

  descricao: string;

  categoria: string;

  tipo:
    'Entrada' |
    'Saída';

  valor: number;

  formaPagamento?:
    FormaPagamento;

  pagamentosPorMes?:
    Record<
      string,
      boolean
    >;

  recorrente?:
    boolean;

  parcelado?:
    boolean;

  frequencia?:
    'mensal';

  dataInicio?:
    string;

  dataFim?:
    string;

  valorTotal?:
    number;

  quantidadeParcelas?:
    number;

  parcelaAtual?:
    number;

  primeiraParcela?:
    string;
};

export type TipoMovimentacaoInvestimento =
  | 'aporte'
  | 'retirada';

export type MovimentacaoInvestimento = {
  id: number;
  caixinha: string;
  tipo:
    TipoMovimentacaoInvestimento;
  valor: number;
  data: string;
};

type PerfilUsuario = {
  nome: string | null;
  avatar_tipo: string | null;
  avatar_url: string | null;
  tema_cor: string | null;
  modo_tema: string | null;
};

type LancamentoBanco = {
  id: number;
  user_id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: 'Entrada' | 'Saída';
  valor: number | string;
  forma_pagamento: FormaPagamento | null;
  pagamentos_por_mes: Record<string, boolean> | null;
  recorrente: boolean | null;
  parcelado: boolean | null;
  frequencia: 'mensal' | null;
  data_inicio: string | null;
  data_fim: string | null;
  valor_total: number | string | null;
  quantidade_parcelas: number | null;
  parcela_atual: number | null;
  primeira_parcela: string | null;
};

function converterLancamentoDoBanco(
  registro: LancamentoBanco
): Lancamento {
  return {
    id: Number(
      registro.id
    ),
    data:
      registro.data,
    descricao:
      registro.descricao,
    categoria:
      registro.categoria,
    tipo:
      registro.tipo,
    valor:
      Number(
        registro.valor
      ),
    formaPagamento:
      registro.forma_pagamento ??
      undefined,
    pagamentosPorMes:
      registro.pagamentos_por_mes ??
      undefined,
    recorrente:
      registro.recorrente ??
      false,
    parcelado:
      registro.parcelado ??
      false,
    frequencia:
      registro.frequencia ??
      undefined,
    dataInicio:
      registro.data_inicio ??
      undefined,
    dataFim:
      registro.data_fim ??
      undefined,
    valorTotal:
      registro.valor_total ===
        null
        ? undefined
        : Number(
            registro.valor_total
          ),
    quantidadeParcelas:
      registro.quantidade_parcelas ??
      undefined,
    parcelaAtual:
      registro.parcela_atual ??
      undefined,
    primeiraParcela:
      registro.primeira_parcela ??
      undefined
  };
}

function converterLancamentoParaBanco(
  lancamento: Lancamento,
  userId: string
) {
  return {
    user_id:
      userId,
    data:
      lancamento.data,
    descricao:
      lancamento.descricao,
    categoria:
      lancamento.categoria,
    tipo:
      lancamento.tipo,
    valor:
      lancamento.valor,
    forma_pagamento:
      lancamento.formaPagamento ??
      null,
    pagamentos_por_mes:
      lancamento.pagamentosPorMes ??
      null,
    recorrente:
      lancamento.recorrente ??
      false,
    parcelado:
      lancamento.parcelado ??
      false,
    frequencia:
      lancamento.frequencia ??
      null,
    data_inicio:
      lancamento.dataInicio ??
      null,
    data_fim:
      lancamento.dataFim ??
      null,
    valor_total:
      lancamento.valorTotal ??
      null,
    quantidade_parcelas:
      lancamento.quantidadeParcelas ??
      null,
    parcela_atual:
      lancamento.parcelaAtual ??
      null,
    primeira_parcela:
      lancamento.primeiraParcela ??
      null
  };
}

type MovimentacaoInvestimentoBanco = {
  id: number;
  user_id: string;
  caixinha: string;
  tipo:
    TipoMovimentacaoInvestimento;
  valor:
    number | string;
  data: string;
};

type AporteAntigo = {
  id: number;
  caixinha: string;
  valor: number;
  data: string;
};

function converterMovimentacaoDoBanco(
  registro:
    MovimentacaoInvestimentoBanco
): MovimentacaoInvestimento {
  return {
    id:
      Number(
        registro.id
      ),
    caixinha:
      registro.caixinha,
    tipo:
      registro.tipo,
    valor:
      Number(
        registro.valor
      ),
    data:
      registro.data
  };
}

function converterMovimentacaoParaBanco(
  movimentacao:
    Omit<
      MovimentacaoInvestimento,
      'id'
    >,
  userId:
    string
) {
  return {
    user_id:
      userId,
    caixinha:
      movimentacao.caixinha,
    tipo:
      movimentacao.tipo,
    valor:
      movimentacao.valor,
    data:
      movimentacao.data
  };
}

function App() {

  const [
    session,
    setSession
  ] =
    useState<
      Session | null
    >(
      null
    );

  const [
    carregandoSessao,
    setCarregandoSessao
  ] =
    useState(true);

  const [
    perfil,
    setPerfil
  ] =
    useState<
      PerfilUsuario | null
    >(
      null
    );

  const [
    pagina,
    setPagina
  ] =
    useState(
      'dashboard'
    );

  const [
    configuracoesAlteradas,
    setConfiguracoesAlteradas
  ] = useState(false);

  const [
    lancamentoParaEditar,
    setLancamentoParaEditar
  ] =
    useState<
      number | null
    >(
      null
    );

  const [
    mesSelecionado,
    setMesSelecionado
  ] =
    useState(
      '2026-09'
    );

  const [
    lancamentos,
    setLancamentos
  ] =
    useState<
      Lancamento[]
    >(
      []
    );

  const [
    carregandoLancamentos,
    setCarregandoLancamentos
  ] =
    useState(
      false
    );

  const [
    movimentacoesInvestimento,
    setMovimentacoesInvestimento
  ] =
    useState<
      MovimentacaoInvestimento[]
    >(
      []
    );

  const [
    carregandoInvestimentos,
    setCarregandoInvestimentos
  ] =
    useState(
      false
    );

  const [
    configuracoesFinanceiras,
    setConfiguracoesFinanceiras
  ] =
    useState<
      ConfiguracoesFinanceiras
    >(
      () =>
        copiarConfiguracoesPadrao()
    );

  const [
    carregandoConfiguracoes,
    setCarregandoConfiguracoes
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      supabase.auth
        .getSession()
        .then(
          ({
            data
          }) => {
            setSession(
              data.session
            );

            setCarregandoSessao(
              false
            );
          }
        );

      const {
        data: {
          subscription
        }
      } =
        supabase.auth
          .onAuthStateChange(
            (
              _evento,
              novaSession
            ) => {
              setSession(
                novaSession
              );

              setCarregandoSessao(
                false
              );
            }
          );

      return () => {
        subscription.unsubscribe();
      };
    },
    []
  );

  useEffect(
    () => {
      if (
        !session
      ) {
        setPerfil(
          null
        );

        return;
      }

      let ativo = true;

      supabase
        .from('profiles')
        .select(
          'nome, avatar_tipo, avatar_url, tema_cor, modo_tema'
        )
        .eq(
          'id',
          session.user.id
        )
        .single()
        .then(
          ({
            data
          }) => {
            if (
              ativo &&
              data
            ) {
              setPerfil(
                data
              );
            }
          }
        );

      return () => {
        ativo = false;
      };
    },
    [
      session
    ]
  );

  useEffect(
    () => {
      if (
        !session
      ) {
        setLancamentos(
          []
        );

        setCarregandoLancamentos(
          false
        );

        return;
      }

      let ativo =
        true;

      async function carregarLancamentos() {
        setCarregandoLancamentos(
          true
        );

        const {
          data,
          error
        } =
          await supabase
            .from(
              'lancamentos'
            )
            .select(
              '*'
            )
            .order(
              'id',
              {
                ascending:
                  true
              }
            );

        if (
          !ativo
        ) {
          return;
        }

        if (
          error
        ) {
          window.alert(
            `Não foi possível carregar seus lançamentos: ${error.message}`
          );

          setCarregandoLancamentos(
            false
          );

          return;
        }

        const registros =
          (
            data ??
            []
          ) as LancamentoBanco[];

        if (
          registros.length >
          0
        ) {
          setLancamentos(
            registros.map(
              converterLancamentoDoBanco
            )
          );

          setCarregandoLancamentos(
            false
          );

          return;
        }

        const chaveMigracao =
          `financas-isabelle-lancamentos-migrados-${session.user.id}`;

        const migracaoJaTratada =
          localStorage.getItem(
            chaveMigracao
          ) === 'sim';

        const dadosLocais =
          localStorage.getItem(
            'financas-isabelle-lancamentos'
          );

        if (
          !migracaoJaTratada &&
          dadosLocais
        ) {
          let lancamentosLocais:
            Lancamento[] =
            [];

          try {
            const dadosConvertidos =
              JSON.parse(
                dadosLocais
              );

            if (
              Array.isArray(
                dadosConvertidos
              )
            ) {
              lancamentosLocais =
                dadosConvertidos;
            }
          }
          catch {
            lancamentosLocais =
              [];
          }

          if (
            lancamentosLocais.length >
            0
          ) {
            const importar =
              window.confirm(
                `Encontramos ${lancamentosLocais.length} lançamento(s) antigos salvos somente neste navegador. Deseja importá-los para esta conta do Supabase?\n\nFaça isso apenas se estes dados forem seus.`
              );

            if (
              importar
            ) {
              const registrosParaImportar =
                lancamentosLocais.map(
                  (
                    lancamento
                  ) =>
                    converterLancamentoParaBanco(
                      lancamento,
                      session.user.id
                    )
                );

              const {
                data:
                  dadosImportados,
                error:
                  erroImportacao
              } =
                await supabase
                  .from(
                    'lancamentos'
                  )
                  .insert(
                    registrosParaImportar
                  )
                  .select(
                    '*'
                  );

              if (
                !ativo
              ) {
                return;
              }

              if (
                erroImportacao
              ) {
                window.alert(
                  `Não foi possível importar os lançamentos antigos: ${erroImportacao.message}`
                );

                setCarregandoLancamentos(
                  false
                );

                return;
              }

              const importados =
                (
                  dadosImportados ??
                  []
                ) as LancamentoBanco[];

              setLancamentos(
                importados.map(
                  converterLancamentoDoBanco
                )
              );

              localStorage.setItem(
                chaveMigracao,
                'sim'
              );

              localStorage.removeItem(
                'financas-isabelle-lancamentos'
              );

              window.alert(
                'Seus lançamentos antigos foram importados para a sua conta com sucesso.'
              );

              setCarregandoLancamentos(
                false
              );

              return;
            }
          }

          localStorage.setItem(
            chaveMigracao,
            'sim'
          );
        }

        setLancamentos(
          []
        );

        setCarregandoLancamentos(
          false
        );
      }

      carregarLancamentos();

      return () => {
        ativo = false;
      };
    },
    [
      session
    ]
  );

  useEffect(
    () => {
      if (
        !session
      ) {
        setMovimentacoesInvestimento(
          []
        );

        setCarregandoInvestimentos(
          false
        );

        return;
      }

      let ativo =
        true;

      async function carregarInvestimentos() {
        setCarregandoInvestimentos(
          true
        );

        const {
          data,
          error
        } =
          await supabase
            .from(
              'investimentos_movimentacoes'
            )
            .select(
              '*'
            )
            .order(
              'id',
              {
                ascending:
                  true
              }
            );

        if (
          !ativo
        ) {
          return;
        }

        if (
          error
        ) {
          window.alert(
            `Não foi possível carregar seus investimentos: ${error.message}`
          );

          setCarregandoInvestimentos(
            false
          );

          return;
        }

        const registros =
          (
            data ??
            []
          ) as MovimentacaoInvestimentoBanco[];

        if (
          registros.length >
          0
        ) {
          setMovimentacoesInvestimento(
            registros.map(
              converterMovimentacaoDoBanco
            )
          );

          setCarregandoInvestimentos(
            false
          );

          return;
        }

        const chaveMigracao =
          `financas-isabelle-investimentos-migrados-${session.user.id}`;

        const migracaoJaTratada =
          localStorage.getItem(
            chaveMigracao
          ) === 'sim';

        if (
          !migracaoJaTratada
        ) {
          let movimentacoesLocais:
            Omit<
              MovimentacaoInvestimento,
              'id'
            >[] =
            [];

          const dadosNovos =
            localStorage.getItem(
              'financas-isabelle-investimentos-movimentacoes'
            );

          if (
            dadosNovos
          ) {
            try {
              const dadosConvertidos =
                JSON.parse(
                  dadosNovos
                ) as MovimentacaoInvestimento[];

              if (
                Array.isArray(
                  dadosConvertidos
                )
              ) {
                movimentacoesLocais =
                  dadosConvertidos.map(
                    (
                      movimentacao
                    ) => ({
                      caixinha:
                        movimentacao.caixinha,
                      tipo:
                        movimentacao.tipo,
                      valor:
                        Number(
                          movimentacao.valor
                        ),
                      data:
                        movimentacao.data
                    })
                  );
              }
            }
            catch {
              movimentacoesLocais =
                [];
            }
          }
          else {
            const aportesAntigos =
              localStorage.getItem(
                'financas-isabelle-aportes'
              );

            if (
              aportesAntigos
            ) {
              try {
                const listaAntiga =
                  JSON.parse(
                    aportesAntigos
                  ) as AporteAntigo[];

                if (
                  Array.isArray(
                    listaAntiga
                  )
                ) {
                  movimentacoesLocais =
                    listaAntiga.map(
                      (
                        aporte
                      ) => ({
                        caixinha:
                          aporte.caixinha,
                        tipo:
                          'aporte' as const,
                        valor:
                          Number(
                            aporte.valor
                          ),
                        data:
                          aporte.data
                      })
                    );
                }
              }
              catch {
                movimentacoesLocais =
                  [];
              }
            }
          }

          if (
            movimentacoesLocais.length >
            0
          ) {
            const importar =
              window.confirm(
                `Encontramos ${movimentacoesLocais.length} movimentação(ões) de investimento salva(s) somente neste navegador. Deseja importá-las para esta conta do Supabase?\n\nFaça isso apenas se estes dados forem seus.`
              );

            if (
              importar
            ) {
              const registrosParaImportar =
                movimentacoesLocais.map(
                  (
                    movimentacao
                  ) =>
                    converterMovimentacaoParaBanco(
                      movimentacao,
                      session.user.id
                    )
                );

              const {
                data:
                  dadosImportados,
                error:
                  erroImportacao
              } =
                await supabase
                  .from(
                    'investimentos_movimentacoes'
                  )
                  .insert(
                    registrosParaImportar
                  )
                  .select(
                    '*'
                  );

              if (
                !ativo
              ) {
                return;
              }

              if (
                erroImportacao
              ) {
                window.alert(
                  `Não foi possível importar os investimentos antigos: ${erroImportacao.message}`
                );

                setCarregandoInvestimentos(
                  false
                );

                return;
              }

              const importados =
                (
                  dadosImportados ??
                  []
                ) as MovimentacaoInvestimentoBanco[];

              setMovimentacoesInvestimento(
                importados.map(
                  converterMovimentacaoDoBanco
                )
              );

              localStorage.setItem(
                chaveMigracao,
                'sim'
              );

              localStorage.removeItem(
                'financas-isabelle-investimentos-movimentacoes'
              );

              localStorage.removeItem(
                'financas-isabelle-aportes'
              );

              window.alert(
                'Seus investimentos antigos foram importados para a sua conta com sucesso.'
              );

              setCarregandoInvestimentos(
                false
              );

              return;
            }
          }

          localStorage.setItem(
            chaveMigracao,
            'sim'
          );
        }

        setMovimentacoesInvestimento(
          []
        );

        setCarregandoInvestimentos(
          false
        );
      }

      carregarInvestimentos();

      return () => {
        ativo = false;
      };
    },
    [
      session
    ]
  );

  async function adicionarMovimentacaoInvestimento(
    novaMovimentacao:
      Omit<
        MovimentacaoInvestimento,
        'id'
      >
  ) {
    if (
      !session
    ) {
      return false;
    }

    const {
      data,
      error
    } =
      await supabase
        .from(
          'investimentos_movimentacoes'
        )
        .insert(
          converterMovimentacaoParaBanco(
            novaMovimentacao,
            session.user.id
          )
        )
        .select(
          '*'
        )
        .single();

    if (
      error
    ) {
      window.alert(
        `Não foi possível salvar a movimentação: ${error.message}`
      );

      return false;
    }

    const movimentacaoSalva =
      converterMovimentacaoDoBanco(
        data as MovimentacaoInvestimentoBanco
      );

    setMovimentacoesInvestimento(
      (
        movimentacoesAtuais
      ) => [
        ...movimentacoesAtuais,
        movimentacaoSalva
      ]
    );

    return true;
  }

  async function excluirMovimentacaoInvestimento(
    id:
      number
  ) {
    const {
      error
    } =
      await supabase
        .from(
          'investimentos_movimentacoes'
        )
        .delete()
        .eq(
          'id',
          id
        );

    if (
      error
    ) {
      window.alert(
        `Não foi possível excluir a movimentação: ${error.message}`
      );

      return false;
    }

    setMovimentacoesInvestimento(
      (
        movimentacoesAtuais
      ) =>
        movimentacoesAtuais.filter(
          (
            movimentacao
          ) =>
            movimentacao.id !==
            id
        )
    );

    return true;
  }

  useEffect(
    () => {
      if (
        !session
      ) {
        setConfiguracoesFinanceiras(
          copiarConfiguracoesPadrao()
        );

        setCarregandoConfiguracoes(
          false
        );

        return;
      }

      let ativo =
        true;

      async function carregarConfiguracoesDaConta() {
        setCarregandoConfiguracoes(
          true
        );

        const {
          data,
          error
        } =
          await supabase
            .from(
              'configuracoes'
            )
            .select(
              'categorias, caixinhas'
            )
            .eq(
              'user_id',
              session.user.id
            )
            .maybeSingle();

        if (
          !ativo
        ) {
          return;
        }

        if (
          error
        ) {
          window.alert(
            `Não foi possível carregar suas configurações: ${error.message}`
          );

          setCarregandoConfiguracoes(
            false
          );

          return;
        }

        if (
          data
        ) {
          setConfiguracoesFinanceiras({
            categorias:
              Array.isArray(
                data.categorias
              )
                ? data.categorias
                : [],
            caixinhas:
              Array.isArray(
                data.caixinhas
              )
                ? data.caixinhas
                : []
          });

          setCarregandoConfiguracoes(
            false
          );

          return;
        }

        let configuracoesIniciais =
          copiarConfiguracoesPadrao();

        const dadosLocais =
          localStorage.getItem(
            'financas-isabelle-configuracoes'
          );

        let importarDadosLocais =
          false;

        if (
          dadosLocais
        ) {
          try {
            const dadosConvertidos =
              JSON.parse(
                dadosLocais
              ) as Partial<
                ConfiguracoesFinanceiras
              >;

            if (
              Array.isArray(
                dadosConvertidos.categorias
              ) &&
              Array.isArray(
                dadosConvertidos.caixinhas
              )
            ) {
              importarDadosLocais =
                window.confirm(
                  'Encontramos categorias e caixinhas antigas salvas somente neste navegador. Deseja importá-las para esta conta do Supabase?\n\nFaça isso apenas se estas configurações forem suas.'
                );

              if (
                importarDadosLocais
              ) {
                configuracoesIniciais = {
                  categorias:
                    dadosConvertidos.categorias,
                  caixinhas:
                    dadosConvertidos.caixinhas
                };
              }
            }
          }
          catch {
            importarDadosLocais =
              false;
          }
        }

        const {
          error:
            erroCriacao
        } =
          await supabase
            .from(
              'configuracoes'
            )
            .upsert({
              user_id:
                session.user.id,
              categorias:
                configuracoesIniciais.categorias,
              caixinhas:
                configuracoesIniciais.caixinhas,
              updated_at:
                new Date()
                  .toISOString()
            });

        if (
          !ativo
        ) {
          return;
        }

        if (
          erroCriacao
        ) {
          window.alert(
            `Não foi possível criar suas configurações: ${erroCriacao.message}`
          );

          setCarregandoConfiguracoes(
            false
          );

          return;
        }

        setConfiguracoesFinanceiras(
          configuracoesIniciais
        );

        if (
          importarDadosLocais
        ) {
          localStorage.removeItem(
            'financas-isabelle-configuracoes'
          );

          window.alert(
            'Suas categorias e caixinhas antigas foram importadas para a sua conta com sucesso.'
          );
        }

        setCarregandoConfiguracoes(
          false
        );
      }

      carregarConfiguracoesDaConta();

      return () => {
        ativo = false;
      };
    },
    [
      session
    ]
  );

  async function salvarConfiguracoesFinanceiras(
    novasConfiguracoes:
      ConfiguracoesFinanceiras
  ) {
    if (
      !session
    ) {
      return false;
    }

    const {
      error
    } =
      await supabase
        .from(
          'configuracoes'
        )
        .upsert({
          user_id:
            session.user.id,
          categorias:
            novasConfiguracoes.categorias,
          caixinhas:
            novasConfiguracoes.caixinhas,
          updated_at:
            new Date()
              .toISOString()
        });

    if (
      error
    ) {
      window.alert(
        `Não foi possível salvar as configurações financeiras: ${error.message}`
      );

      return false;
    }

    setConfiguracoesFinanceiras(
      JSON.parse(
        JSON.stringify(
          novasConfiguracoes
        )
      )
    );

    return true;
  }

  async function adicionarLancamento(
    novoLancamento:
      Lancamento
  ) {
    if (
      !session
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .from(
          'lancamentos'
        )
        .insert(
          converterLancamentoParaBanco(
            novoLancamento,
            session.user.id
          )
        )
        .select(
          '*'
        )
        .single();

    if (
      error
    ) {
      window.alert(
        `Não foi possível salvar o lançamento: ${error.message}`
      );

      return;
    }

    const lancamentoSalvo =
      converterLancamentoDoBanco(
        data as LancamentoBanco
      );

    setLancamentos(
      (
        lancamentosAtuais
      ) => [
        ...lancamentosAtuais,
        lancamentoSalvo
      ]
    );
  }

  async function editarLancamento(
    lancamentoAtualizado:
      Lancamento
  ) {
    if (
      !session
    ) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .from(
          'lancamentos'
        )
        .update(
          converterLancamentoParaBanco(
            lancamentoAtualizado,
            session.user.id
          )
        )
        .eq(
          'id',
          lancamentoAtualizado.id
        )
        .select(
          '*'
        )
        .single();

    if (
      error
    ) {
      window.alert(
        `Não foi possível atualizar o lançamento: ${error.message}`
      );

      return;
    }

    const lancamentoSalvo =
      converterLancamentoDoBanco(
        data as LancamentoBanco
      );

    setLancamentos(
      (
        lancamentosAtuais
      ) =>
        lancamentosAtuais.map(
          (
            lancamento
          ) =>
            lancamento.id ===
            lancamentoSalvo.id
              ? lancamentoSalvo
              : lancamento
        )
    );
  }

  async function excluirLancamento(
    id: number
  ) {
    const {
      error
    } =
      await supabase
        .from(
          'lancamentos'
        )
        .delete()
        .eq(
          'id',
          id
        );

    if (
      error
    ) {
      window.alert(
        `Não foi possível excluir o lançamento: ${error.message}`
      );

      return;
    }

    setLancamentos(
      (
        lancamentosAtuais
      ) =>
        lancamentosAtuais.filter(
          (
            lancamento
          ) =>
            lancamento.id !==
            id
        )
    );
  }

  function selecionarMes(
    novoMes: string
  ) {

    setMesSelecionado(
      novoMes
    );

  }

  function mesAnterior() {

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

    setMesSelecionado(
      `${data.getFullYear()}-${String(
        data.getMonth() + 1
      ).padStart(
        2,
        '0'
      )}`
    );

  }

  function proximoMes() {

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
        mes,
        1
      );

    setMesSelecionado(
      `${data.getFullYear()}-${String(
        data.getMonth() + 1
      ).padStart(
        2,
        '0'
      )}`
    );

  }

  function confirmarSaidaConfiguracoes() {
    if (
      pagina !== 'configuracoes' ||
      !configuracoesAlteradas
    ) {
      return true;
    }

    return window.confirm(
      'Você fez alterações nas Configurações e ainda não salvou. Deseja sair sem salvar?'
    );
  }

  function mudarPaginaComConfirmacao(
    novaPagina: string
  ) {
    if (
      novaPagina === pagina
    ) {
      return;
    }

    if (
      !confirmarSaidaConfiguracoes()
    ) {
      return;
    }

    setPagina(novaPagina);
  }

  function abrirSecaoLancamentos(
    secao:
      | 'fixas'
      | 'parcelados'
      | 'entradas'
      | 'gastos'
  ) {
    if (
      !confirmarSaidaConfiguracoes()
    ) {
      return;
    }

    setPagina('lancamentos');

    window.setTimeout(() => {
      document
        .getElementById(`lancamentos-${secao}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    }, 80);
  }

  function abrirConfiguracao(
    secao:
      | 'perfil'
      | 'aparencia'
      | 'caixinhas'
      | 'categorias'
  ) {
    if (
      pagina !== 'configuracoes'
    ) {
      if (
        !confirmarSaidaConfiguracoes()
      ) {
        return;
      }

      setPagina('configuracoes');
    }

    window.setTimeout(() => {
      document
        .getElementById(`config-${secao}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    }, 80);
  }

  function abrirCaixinhaInvestimento(
    id: string
  ) {
    if (
      !confirmarSaidaConfiguracoes()
    ) {
      return;
    }

    setPagina('investimentos');

    window.setTimeout(() => {
      document
        .getElementById(`caixinha-${id}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
    }, 80);
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  const nomeUsuario =
    perfil?.nome
    ||
    session?.user
      .user_metadata
      ?.nome
    ||
    session?.user.email
      ?.split('@')[0]
    ||
    'Usuário';

  const avatarTipo =
    perfil?.avatar_tipo
    ||
    session?.user
      .user_metadata
      ?.avatar_tipo
    ||
    'tubarao';

  const avatarUrl =
    perfil?.avatar_url
    ||
    null;

  const temaCor =
    perfil?.tema_cor
    ||
    'rosa';

  const modoTema =
    perfil?.modo_tema
    ||
    'claro';

  useEffect(() => {
    document.documentElement
      .setAttribute(
        'data-theme-color',
        temaCor
      );

    document.documentElement
      .setAttribute(
        'data-theme-mode',
        modoTema
      );
  }, [
    temaCor,
    modoTema
  ]);

  const emailUsuario =
    session?.user.email ??
    '';

  if (
    carregandoSessao
  ) {
    return (
      <div className="auth-carregando">
        Carregando...
      </div>
    );
  }

  if (
    !session
  ) {
    return (
      <Auth />
    );
  }

  if (
    carregandoLancamentos ||
    carregandoInvestimentos ||
    carregandoConfiguracoes
  ) {
    return (
      <div className="auth-carregando">
        Carregando suas finanças...
      </div>
    );
  }

  return (

    <div className="layout">

      <Sidebar
        paginaAtual={
          pagina
        }

        mudarPagina={
          mudarPaginaComConfirmacao
        }

        abrirConfiguracao={
          abrirConfiguracao
        }

        abrirSecaoLancamentos={
          abrirSecaoLancamentos
        }

        abrirCaixinhaInvestimento={
          abrirCaixinhaInvestimento
        }

        nomeUsuario={
          nomeUsuario
        }

        emailUsuario={
          emailUsuario
        }

        avatarTipo={
          avatarTipo
        }

        avatarUrl={
          avatarUrl
        }

        configuracoes={
          configuracoesFinanceiras
        }

        onSair={
          sair
        }
      />

      <div className="content">

        <main className="dashboard">

          {pagina ===
            'dashboard' && (

            <Dashboard
              lancamentos={
                lancamentos
              }

              movimentacoesInvestimento={
                movimentacoesInvestimento
              }

              configuracoes={
                configuracoesFinanceiras
              }

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

              editarLancamento={
                editarLancamento
              }

              abrirLancamentos={(
                id: number
              ) => {

                setLancamentoParaEditar(
                  id
                );

                setPagina(
                  'lancamentos'
                );

              }}
            />

          )}

          {pagina ===
            'lancamentos' && (

            <Lancamentos
              lancamentos={
                lancamentos
              }

              configuracoes={
                configuracoesFinanceiras
              }

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

              adicionarLancamento={
                adicionarLancamento
              }

              editarLancamento={
                editarLancamento
              }

              excluirLancamento={
                excluirLancamento
              }

              lancamentoParaEditar={
                lancamentoParaEditar
              }

              limparLancamentoParaEditar={() => {

                setLancamentoParaEditar(
                  null
                );

              }}
            />

          )}

          {pagina ===
            'relatorios' && (

            <Relatorios
              lancamentos={
                lancamentos
              }

              movimentacoesInvestimento={
                movimentacoesInvestimento
              }

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

          )}

          {pagina ===
            'investimentos' && (

            <Investimentos
              lancamentos={
                lancamentos
              }

              movimentacoes={
                movimentacoesInvestimento
              }

              adicionarMovimentacao={
                adicionarMovimentacaoInvestimento
              }

              excluirMovimentacao={
                excluirMovimentacaoInvestimento
              }

              configuracoes={
                configuracoesFinanceiras
              }

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

          )}

          {pagina ===
            'configuracoes' && (

            <Configuracoes
              onAlteracoesPendentes={
                setConfiguracoesAlteradas
              }

              configuracoesSalvas={
                configuracoesFinanceiras
              }

              onSalvarConfiguracoes={
                salvarConfiguracoesFinanceiras
              }

              userId={
                session.user.id
              }

              nomeUsuario={
                nomeUsuario
              }

              avatarTipo={
                avatarTipo
              }

              avatarUrl={
                avatarUrl
              }

              temaCor={
                temaCor
              }

              modoTema={
                modoTema
              }

              onPerfilAtualizado={(
                perfilAtualizado
              ) => {
                setPerfil(
                  perfilAtualizado
                );
              }}
            />

          )}

        </main>

      </div>

    </div>

  );

}

export default App;
