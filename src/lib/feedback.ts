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


export type EscolhaSaidaConfiguracoes =
  | 'cancelar'
  | 'salvar'
  | 'sair';

export function escolherSaidaConfiguracoes(): Promise<EscolhaSaidaConfiguracoes> {
  return new Promise(
    (resolver) => {
      window.dispatchEvent(
        new CustomEvent(
          'controle-financeiro:confirmacao-tres-opcoes',
          {
            detail: {
              titulo:
                'Sair sem salvar?',
              mensagem:
                'Você fez alterações nas Configurações e ainda não salvou. O que deseja fazer?',
              textoCancelar:
                'Cancelar',
              textoAlternativo:
                'Salvar e sair',
              textoConfirmar:
                'Sair sem salvar',
              perigoso:
                true,
              resolver
            }
          }
        )
      );
    }
  );
}
