import { cn } from "@/lib/utils";

const TOPS = [
  ["PP", "50", "68", "20"],
  ["P", "53", "70", "21"],
  ["M", "56", "72", "22"],
  ["G", "59", "74", "23"],
  ["GG", "62", "76", "24"],
  ["XGG", "65", "78", "25"],
];
const BOTTOMS = [
  ["PP", "72", "98", "76"],
  ["P", "76", "102", "77"],
  ["M", "80", "106", "78"],
  ["G", "84", "110", "79"],
  ["GG", "88", "114", "80"],
  ["XGG", "92", "118", "81"],
];

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-[14px] tabular-nums">
        <caption className="mb-3 text-left text-[15px] font-semibold">{caption}</caption>
        <thead>
          <tr className="border-b border-ink">
            {head.map((h) => (
              <th key={h} scope="col" className="py-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-stone">
              {r.map((c, i) => (
                <td key={i} className={cn("py-2.5 pr-4", i === 0 && "font-semibold")}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SizeGuideTables() {
  return (
    <div className="space-y-10">
      <Table caption="Camisetas, moletons e jaquetas (cm)" head={["Tamanho", "Largura do peito", "Comprimento", "Manga"]} rows={TOPS} />
      <Table caption="Calças e shorts (cm)" head={["Tamanho", "Cintura", "Quadril", "Entrepernas"]} rows={BOTTOMS} />
      <div className="text-[14px] leading-relaxed text-graphite">
        <p className="font-semibold text-ink">Como medir</p>
        <p className="mt-1">
          Meça uma peça que você já usa, esticada sobre uma superfície plana. A largura do peito é medida 2 cm abaixo da
          cava, de lado a lado. As peças oversized já têm folga na modelagem: se estiver entre dois tamanhos, escolha o
          menor.
        </p>
      </div>
    </div>
  );
}
