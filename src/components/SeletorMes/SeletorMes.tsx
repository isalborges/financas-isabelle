import {
  useEffect,
  useRef,
  useState
} from 'react';

import './SeletorMes.css';


type SeletorMesProps = {
  mesSelecionado: string;
  mesAnterior: () => void;
  proximoMes: () => void;
  selecionarMes: (mes: string) => void;
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


function SeletorMes({
  mesSelecionado,
  mesAnterior,
  proximoMes,
  selecionarMes
}: SeletorMesProps) {
  const [aberto, setAberto] = useState(false);
  const [visualizacao, setVisualizacao] = useState<'meses' | 'anos'>('meses');
  const [anoExibido, setAnoExibido] = useState(
    Number(mesSelecionado.split('-')[0])
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const [anoSelecionado, numeroMesSelecionado] =
    mesSelecionado.split('-').map(Number);


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


  function escolherMes(indiceMes: number) {
    const numeroMes = String(indiceMes + 1).padStart(2, '0');

    selecionarMes(`${anoExibido}-${numeroMes}`);
    setAberto(false);
    setVisualizacao('meses');
  }


  function irParaMesAnterior() {
    setAberto(false);
    setVisualizacao('meses');
    mesAnterior();
  }


  function irParaProximoMes() {
    setAberto(false);
    setVisualizacao('meses');
    proximoMes();
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
      <div className="seletor-mes-navegacao">
        <button
          type="button"
          className="seletor-mes-seta"
          onClick={irParaMesAnterior}
          aria-label="Mês anterior"
        >
          ‹
        </button>

        <button
          type="button"
          className={`seletor-mes-atual ${aberto ? 'aberto' : ''}`}
          onClick={alternarCalendario}
        >
          <span>{nomeMesAtual()}</span>
          <span className="seletor-mes-chevron">▾</span>
        </button>

        <button
          type="button"
          className="seletor-mes-seta"
          onClick={irParaProximoMes}
          aria-label="Próximo mês"
        >
          ›
        </button>
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

                  return (
                    <button
                      type="button"
                      key={nome}
                      className={`seletor-mes-opcao ${ativo ? 'ativo' : ''}`}
                      onClick={() => escolherMes(indice)}
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
