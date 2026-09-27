type CardFinanceiroProps = {
  titulo: string;
  valor: string;
};

function CardFinanceiro({ titulo, valor }: CardFinanceiroProps) {
  return (
    <div className="card">
      <span>{titulo}</span>
      <h3>{valor}</h3>
    </div>
  );
}

export default CardFinanceiro;