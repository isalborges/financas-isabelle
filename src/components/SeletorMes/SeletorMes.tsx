import {
  useEffect,
  useRef,
  useState
} from 'react';

import './SeletorMes.css';


type SeletorMesProps = {
  mesSelecionado: string;
  mesAnterior?: () => void;
  proximoMes?: () => void;
  selecionarMes: (mes: string) => void;
  apenasSelecao?: boolean;
  mesMinimo?: string | null;
};


const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];


function normalizarMesAno(
  valor: string
) {
  const atual =
    new Date();

  const fallback =
    `${atual.getFullYear()}-${String(
      atual.getMonth() + 1
    ).padStart(2, '0')}`;

  const texto =
    String(
      valor ?? ''
    ).trim();

  if (
    /^\d{4}-\d{2}$/.test(
      texto
    )
  ) {
    const [
      ano,
      mes
    ] =
      texto
        .split('-')
        .map(Number);

    if (
      ano >= 1900 &&
      mes >= 1 &&
      mes <= 12
    ) {
      return texto;
    }
  }

  if (
    /^\d{2}\/\d{4}$/.test(
      texto
    )
  ) {
    const [
      mes,
      ano
    ] =
      texto
        .split('/')
        .map(Number);

    if (
      ano >= 1900 &&
      mes >= 1 &&
      mes <= 12
    ) {
      return `${ano}-${String(
        mes
      ).padStart(2, '0')}`;
    }
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {
    const [
      ano,
      mes
    ] =
      texto
        .slice(
          0,
          7
        )
        .split('-')
        .map(Number);

    if (
      ano >= 1900 &&
      mes >= 1 &&
      mes <= 12
    ) {
      return `${ano}-${String(
        mes
      ).padStart(2, '0')}`;
    }
  }

  return fallback;
}


function SeletorMes({
  mesSelecionado,
  mesAnterior,
  proximoMes,
  selecionarMes,
  apenasSelecao = false,
  mesMinimo = null
}: SeletorMesProps) {
  const mesNormalizado =
    normalizarMesAno(
      mesSelecionado
    );

  const mesMinimoNormalizado =
    mesMinimo
      ? normalizarMesAno(
          mesMinimo
        )
      : null;

  const [aberto, setAberto] = useState(false);
  const [visualizacao, setVisualizacao] = useState<'meses' | 'anos'>('meses');

  const [
    anoSelecionado,
    numeroMesSelecionado
  ] =
    mesNormalizado
      .split('-')
      .map(Number);

  const [anoExibido, setAnoExibido] = useState(
    anoSelecionado
  );

  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(
    () => {
      if (
        !aberto
      ) {
        setAnoExibido(
          anoSelecionado
        );
      }
    },
    [
      anoSelecionado,
      aberto
    ]
  );


  useEffect(() => {
    function fecharAoClicarFora(evento: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(evento.target as Node)
      ) {
        setAberto(false);
        setVisualizacao('meses');
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora);

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
    };
  }, []);


  function nomeMesAtual() {
    return `${meses[numeroMesSelecionado - 1]} ${anoSelecionado}`;
  }


  function alternarCalendario() {
    if (aberto) {
      setAberto(false);
      setVisualizacao('meses');
      return;
    }

    setAnoExibido(anoSelecionado);
    setVisualizacao('meses');
    setAberto(true);
  }


  function mesPermitido(
    ano: number,
    indiceMes: number
  ) {
    if (
      !mesMinimo
    ) {
      return true;
    }

    const numeroMes =
      String(
        indiceMes + 1
      ).padStart(
        2,
        '0'
      );

    return (
      !mesMinimoNormalizado ||
      `${ano}-${numeroMes}` >=
      mesMinimoNormalizado
    );
  }

  function escolherMes(indiceMes: number) {
    if (
      !mesPermitido(
        anoExibido,
        indiceMes
      )
    ) {
      return;
    }

    const numeroMes = String(indiceMes + 1).padStart(2, '0');

    selecionarMes(`${anoExibido}-${numeroMes}`);
    setAberto(false);
    setVisualizacao('meses');
  }


  function irParaMesAnterior() {
    if (
      mesMinimoNormalizado !== null &&
      mesNormalizado <=
        mesMinimoNormalizado
    ) {
      return;
    }

    setAberto(false);
    setVisualizacao('meses');
    mesAnterior?.();
  }


  function irParaProximoMes() {
    setAberto(false);
    setVisualizacao('meses');
    proximoMes?.();
  }


  const primeiroAno = anoExibido - 5;

  const anos = Array.from(
    { length: 12 },
    (_, indice) => primeiroAno + indice
  );


  return (
    <div
      className="seletor-mes"
      ref={containerRef}
    >
      <div
        className={`seletor-mes-navegacao ${
          apenasSelecao
            ? 'seletor-mes-navegacao-apenas-selecao'
            : ''
        }`}
      >
        {!apenasSelecao && (
          <button
            type="button"
            className="seletor-mes-seta"
            onClick={irParaMesAnterior}
            aria-label="Mês anterior"
            disabled={
              Boolean(
                mesMinimo &&
                mesSelecionado <=
                  mesMinimo
              )
            }
          >
            ‹
          </button>
        )}

        <button
          type="button"
          className={`seletor-mes-atual ${
            aberto
              ? 'aberto'
              : ''
          } ${
            apenasSelecao
              ? 'seletor-mes-atual-campo'
              : ''
          }`}
          onClick={alternarCalendario}
        >
          <span>{nomeMesAtual()}</span>
          <span className="seletor-mes-chevron">▾</span>
        </button>

        {!apenasSelecao && (
          <button
            type="button"
            className="seletor-mes-seta"
            onClick={irParaProximoMes}
            aria-label="Próximo mês"
          >
            ›
          </button>
        )}
      </div>


      {aberto && (
        <div className="seletor-mes-popover">
          {visualizacao === 'meses' ? (
            <>
              <button
                type="button"
                className="seletor-mes-ano"
                onClick={() => setVisualizacao('anos')}
              >
                <span>{anoExibido}</span>
                <span>▾</span>
              </button>

              <div className="seletor-mes-grid">
                {meses.map((nome, indice) => {
                  const ativo =
                    anoExibido === anoSelecionado &&
                    indice + 1 === numeroMesSelecionado;

                  const permitido =
                    mesPermitido(
                      anoExibido,
                      indice
                    );

                  return (
                    <button
                      type="button"
                      key={nome}
                      className={`seletor-mes-opcao ${
                        ativo
                          ? 'ativo'
                          : ''
                      } ${
                        !permitido
                          ? 'desabilitado'
                          : ''
                      }`}
                      onClick={() => escolherMes(indice)}
                      disabled={!permitido}
                    >
                      {nome}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="seletor-ano-cabecalho">
                <button
                  type="button"
                  onClick={() => setAnoExibido((anoAtual) => anoAtual - 12)}
                >
                  ‹
                </button>

                <strong>
                  {primeiroAno} – {primeiroAno + 11}
                </strong>

                <button
                  type="button"
                  onClick={() => setAnoExibido((anoAtual) => anoAtual + 12)}
                >
                  ›
                </button>
              </div>

              <div className="seletor-ano-grid">
                {anos.map((ano) => (
                  <button
                    type="button"
                    key={ano}
                    className={`seletor-ano-opcao ${
                      ano === anoSelecionado ? 'ativo' : ''
                    }`}
                    onClick={() => {
                      setAnoExibido(ano);
                      setVisualizacao('meses');
                    }}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


export default SeletorMes;
