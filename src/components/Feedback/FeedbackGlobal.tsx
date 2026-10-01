import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  notificar
} from '../../lib/feedback';

import type {
  TipoNotificacao
} from '../../lib/feedback';

import './FeedbackGlobal.css';

type Notificacao = {
  id: number;
  mensagem: string;
  tipo: TipoNotificacao;
  titulo?: string;
};

type ConfirmacaoPendente = {
  titulo?: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigoso?: boolean;
  resolver: (
    confirmado: boolean
  ) => void;
};

type ConfirmacaoTresOpcoes = {
  titulo?: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  textoAlternativo?: string;
  perigoso?: boolean;
  resolver: (
    escolha:
      | 'cancelar'
      | 'salvar'
      | 'sair'
  ) => void;
};

function tituloPadrao(
  tipo: TipoNotificacao
) {
  if (tipo === 'sucesso') {
    return 'Tudo certo!';
  }

  if (tipo === 'erro') {
    return 'Ops!';
  }

  if (tipo === 'aviso') {
    return 'Atenção';
  }

  return 'Aviso';
}

function tipoMensagemLegada(
  mensagem: string
): TipoNotificacao {
  const texto =
    mensagem.toLowerCase();

  if (
    texto.includes('não foi possível') ||
    texto.includes('erro') ||
    texto.includes('inválid') ||
    texto.includes('falhou')
  ) {
    return 'erro';
  }

  if (
    texto.includes('não pode') ||
    texto.includes('não podem') ||
    texto.includes('atenção')
  ) {
    return 'aviso';
  }

  if (
    texto.includes('salv') ||
    texto.includes('atualiz') ||
    texto.includes('importad') ||
    texto.includes('conclu')
  ) {
    return 'sucesso';
  }

  return 'info';
}

function FeedbackGlobal() {
  const [
    notificacoes,
    setNotificacoes
  ] =
    useState<
      Notificacao[]
    >([]);

  const [
    confirmacao,
    setConfirmacao
  ] =
    useState<
      ConfirmacaoPendente | null
    >(null);

  const [
    confirmacaoTresOpcoes,
    setConfirmacaoTresOpcoes
  ] =
    useState<
      ConfirmacaoTresOpcoes | null
    >(null);

  const proximoId =
    useRef(1);

  useEffect(
    () => {
      function tratarNotificacao(
        evento: Event
      ) {
        const detalhe =
          (
            evento as CustomEvent<{
              mensagem: string;
              tipo?: TipoNotificacao;
              titulo?: string;
            }>
          ).detail;

        const id =
          proximoId.current++;

        setNotificacoes(
          (
            atuais
          ) => [
            ...atuais,
            {
              id,
              mensagem:
                detalhe.mensagem,
              tipo:
                detalhe.tipo ??
                'info',
              titulo:
                detalhe.titulo
            }
          ]
        );

        window.setTimeout(
          () => {
            setNotificacoes(
              (
                atuais
              ) =>
                atuais.filter(
                  (
                    item
                  ) =>
                    item.id !== id
                )
            );
          },
          4200
        );
      }

      function tratarConfirmacao(
        evento: Event
      ) {
        const detalhe =
          (
            evento as CustomEvent<
              ConfirmacaoPendente
            >
          ).detail;

        setConfirmacao(
          detalhe
        );
      }

      function tratarConfirmacaoTresOpcoes(
        evento: Event
      ) {
        const detalhe =
          (
            evento as CustomEvent<
              ConfirmacaoTresOpcoes
            >
          ).detail;

        setConfirmacaoTresOpcoes(
          detalhe
        );
      }

      const alertaOriginal =
        window.alert;

      window.alert = (
        mensagem?: unknown
      ) => {
        const texto =
          String(
            mensagem ?? ''
          );

        notificar(
          texto,
          tipoMensagemLegada(
            texto
          )
        );
      };

      window.addEventListener(
        'controle-financeiro:notificacao',
        tratarNotificacao
      );

      window.addEventListener(
        'controle-financeiro:confirmacao',
        tratarConfirmacao
      );

      window.addEventListener(
        'controle-financeiro:confirmacao-tres-opcoes',
        tratarConfirmacaoTresOpcoes
      );

      return () => {
        window.alert =
          alertaOriginal;

        window.removeEventListener(
          'controle-financeiro:notificacao',
          tratarNotificacao
        );

        window.removeEventListener(
          'controle-financeiro:confirmacao',
          tratarConfirmacao
        );

        window.removeEventListener(
          'controle-financeiro:confirmacao-tres-opcoes',
          tratarConfirmacaoTresOpcoes
        );
      };
    },
    []
  );

  function fecharNotificacao(
    id: number
  ) {
    setNotificacoes(
      (
        atuais
      ) =>
        atuais.filter(
          (
            item
          ) =>
            item.id !== id
        )
    );
  }

  function responderConfirmacao(
    resposta: boolean
  ) {
    if (
      !confirmacao
    ) {
      return;
    }

    confirmacao.resolver(
      resposta
    );

    setConfirmacao(
      null
    );
  }

  function responderConfirmacaoTresOpcoes(
    escolha:
      | 'cancelar'
      | 'salvar'
      | 'sair'
  ) {
    if (
      !confirmacaoTresOpcoes
    ) {
      return;
    }

    confirmacaoTresOpcoes.resolver(
      escolha
    );

    setConfirmacaoTresOpcoes(
      null
    );
  }

  return (
    <>
      <div
        className="feedback-toast-area"
        aria-live="polite"
        aria-atomic="false"
      >
        {notificacoes.map(
          (
            notificacao
          ) => (
            <div
              key={
                notificacao.id
              }
              className={`feedback-toast feedback-toast-${notificacao.tipo}`}
            >
              <div className="feedback-toast-icone">
                {notificacao.tipo ===
                  'sucesso'
                  ? '✓'
                  : notificacao.tipo ===
                      'erro'
                    ? '!'
                    : notificacao.tipo ===
                        'aviso'
                      ? '!'
                      : 'i'
                }
              </div>

              <div className="feedback-toast-conteudo">
                <strong>
                  {notificacao.titulo ??
                    tituloPadrao(
                      notificacao.tipo
                    )}
                </strong>

                <p>
                  {notificacao.mensagem}
                </p>
              </div>

              <button
                type="button"
                className="feedback-toast-fechar"
                aria-label="Fechar aviso"
                onClick={() =>
                  fecharNotificacao(
                    notificacao.id
                  )
                }
              >
                ×
              </button>
            </div>
          )
        )}
      </div>

      {confirmacao && (
        <div
          className="feedback-confirmacao-backdrop"
          onMouseDown={() =>
            responderConfirmacao(
              false
            )
          }
        >
          <div
            className="feedback-confirmacao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-confirmacao-titulo"
            onMouseDown={(
              evento
            ) =>
              evento.stopPropagation()
            }
          >
            <div className="feedback-confirmacao-icone">
              ?
            </div>

            <div className="feedback-confirmacao-conteudo">
              <h3
                id="feedback-confirmacao-titulo"
              >
                {confirmacao.titulo ??
                  'Confirmar ação'
                }
              </h3>

              <p>
                {confirmacao.mensagem}
              </p>
            </div>

            <div className="feedback-confirmacao-acoes">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  responderConfirmacao(
                    false
                  )
                }
              >
                {confirmacao.textoCancelar ??
                  'Cancelar'
                }
              </button>

              <button
                type="button"
                className={
                  confirmacao.perigoso
                    ? 'feedback-btn-perigo'
                    : 'btn-primary'
                }
                onClick={() =>
                  responderConfirmacao(
                    true
                  )
                }
              >
                {confirmacao.textoConfirmar ??
                  'Confirmar'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmacaoTresOpcoes && (
        <div
          className="feedback-confirmacao-backdrop"
          onMouseDown={() =>
            responderConfirmacaoTresOpcoes(
              'cancelar'
            )
          }
        >
          <div
            className="feedback-confirmacao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-confirmacao-tres-titulo"
            onMouseDown={(
              evento
            ) =>
              evento.stopPropagation()
            }
          >
            <div className="feedback-confirmacao-icone">
              ?
            </div>

            <div className="feedback-confirmacao-conteudo">
              <h3
                id="feedback-confirmacao-tres-titulo"
              >
                {confirmacaoTresOpcoes.titulo ??
                  'Confirmar ação'
                }
              </h3>

              <p>
                {confirmacaoTresOpcoes.mensagem}
              </p>
            </div>

            <div className="feedback-confirmacao-acoes feedback-confirmacao-acoes-tres">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  responderConfirmacaoTresOpcoes(
                    'cancelar'
                  )
                }
              >
                {confirmacaoTresOpcoes.textoCancelar ??
                  'Cancelar'
                }
              </button>

              <button
                type="button"
                className="feedback-btn-salvar"
                onClick={() =>
                  responderConfirmacaoTresOpcoes(
                    'salvar'
                  )
                }
              >
                {confirmacaoTresOpcoes.textoAlternativo ??
                  'Salvar e sair'
                }
              </button>

              <button
                type="button"
                className={
                  confirmacaoTresOpcoes.perigoso
                    ? 'feedback-btn-perigo'
                    : 'btn-primary'
                }
                onClick={() =>
                  responderConfirmacaoTresOpcoes(
                    'sair'
                  )
                }
              >
                {confirmacaoTresOpcoes.textoConfirmar ??
                  'Sair sem salvar'
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

export default FeedbackGlobal;
