export type TipoNotificacao =
  | 'sucesso'
  | 'erro'
  | 'aviso'
  | 'info';

export type ConfirmacaoOpcoes = {
  titulo?: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigoso?: boolean;
};

export function notificar(
  mensagem: string,
  tipo: TipoNotificacao = 'info',
  titulo?: string
) {
  window.dispatchEvent(
    new CustomEvent(
      'controle-financeiro:notificacao',
      {
        detail: {
          mensagem,
          tipo,
          titulo
        }
      }
    )
  );
}

export function confirmarAcao(
  opcoes: ConfirmacaoOpcoes
): Promise<boolean> {
  return new Promise(
    (resolver) => {
      window.dispatchEvent(
        new CustomEvent(
          'controle-financeiro:confirmacao',
          {
            detail: {
              ...opcoes,
              resolver
            }
          }
        )
      );
    }
  );
}
