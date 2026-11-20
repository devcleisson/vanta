import Link from "next/link";
import { SizeGuideTables } from "@/components/store/size-guide";
import { siteConfig } from "./site";

export type HelpPage = { title: string; heading: string; description: string; body: React.ReactNode };

const P = ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={`mb-5 text-[16px] leading-[1.7] ${className ?? "text-graphite"}`}>{children}</p>;
const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 mt-10 text-[18px] font-semibold text-ink">{children}</h2>;

export const helpPages: Record<string, HelpPage> = {
  envio: {
    title: "Envio e prazos",
    heading: "Shipping",
    description: "Modalidades, prazos por região e frete grátis.",
    body: (
      <>
        <P>Pedidos com pagamento aprovado até 14h (dias úteis) são separados e despachados no mesmo dia. Depois disso, saem no próximo dia útil.</P>
        <H>Modalidades</H>
        <P>Econômica: de 2 a 14 dias úteis conforme a região, grátis para compras a partir de R$ 499. Expressa: de 1 a 6 dias úteis. Retirada na loja: pronta em 1 dia útil na Rua Augusta, 1200, em São Paulo.</P>
        <H>Prazos por região (Econômica)</H>
        <ul className="mb-5 list-disc space-y-1 pl-5 text-[16px] text-graphite">
          <li>Grande São Paulo: 2 a 4 dias úteis</li>
          <li>Interior de SP: 3 a 5 dias úteis</li>
          <li>Sul e Sudeste: 4 a 8 dias úteis</li>
          <li>Centro-Oeste, Bahia e Sergipe: 6 a 10 dias úteis</li>
          <li>Demais estados do Nordeste e Norte: 7 a 14 dias úteis</li>
        </ul>
        <P>O valor exato aparece no carrinho assim que você informa o CEP.</P>
      </>
    ),
  },
  "trocas-e-devolucoes": {
    title: "Trocas e devoluções",
    heading: "Returns",
    description: "Primeira troca grátis e devolução em até 7 dias.",
    body: (
      <>
        <P>A primeira troca de cada pedido é grátis e pode ser solicitada em até 30 dias após o recebimento, por tamanho ou cor, sujeita a estoque.</P>
        <H>Arrependimento</H>
        <P>Conforme o Código de Defesa do Consumidor, você pode desistir da compra em até 7 dias corridos após receber o pedido. O reembolso é integral, incluindo o frete, no mesmo meio de pagamento.</P>
        <H>Condições</H>
        <P>A peça deve estar sem sinais de uso, sem lavagem e com a etiqueta original. Bonés e bolsas devem voltar na embalagem original.</P>
        <H>Como solicitar</H>
        <P>Escreva para {siteConfig.email} com o número do pedido. Respondemos em até 1 dia útil com o código de postagem.</P>
      </>
    ),
  },
  "guia-de-tamanhos": {
    title: "Guia de tamanhos",
    heading: "Size guide",
    description: "Medidas das peças VANTA em centímetros.",
    body: <SizeGuideTables />,
  },
  contato: {
    title: "Fale conosco",
    heading: "Contact",
    description: "Atendimento VANTA.",
    body: (
      <>
        <P>Atendemos de segunda a sexta, das 9h às 18h, pelo e-mail <a className="text-ink underline" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>. Respostas em até 1 dia útil.</P>
        <H>Loja</H>
        <P>Rua Augusta, 1200 — Consolação, São Paulo/SP. Terça a sábado, das 11h às 20h.</P>
        <H>Pedidos</H>
        <P>
          Para acompanhar um pedido, acesse <Link href="/account/orders" className="text-ink underline">Meus pedidos</Link> ou o link da página de confirmação.
        </P>
      </>
    ),
  },
  sobre: {
    title: "Sobre a VANTA",
    heading: "About",
    description: "Streetwear premium, feito em São Paulo.",
    body: (
      <>
        <P>A VANTA nasceu da vontade de fazer poucas peças, bem feitas. Trabalhamos com malhas de gramatura alta, modelagens testadas em corpos reais e uma paleta curta: preto, cinza, osso e um ou outro tom da cidade.</P>
        <P>Toda a coleção é produzida em oficinas parceiras em São Paulo, em lotes pequenos. Quando um tamanho esgota, ele volta — mas não com pressa.</P>
        <P className="text-smoke">A VANTA é uma marca fictícia criada para este projeto de portfólio.</P>
      </>
    ),
  },
  privacidade: {
    title: "Política de privacidade",
    heading: "Privacy",
    description: "Como tratamos seus dados.",
    body: (
      <>
        <P>Coletamos apenas os dados necessários para processar pedidos e manter sua conta: nome, e-mail, telefone, CPF (para emissão de nota fiscal) e endereço de entrega.</P>
        <H>Pagamentos</H>
        <P>Dados de cartão nunca passam pelos nossos servidores. Quando o pagamento está habilitado, ele é processado pelo Stripe em uma página hospedada por ele.</P>
        <H>Armazenamento local</H>
        <P>Seu carrinho e seus favoritos ficam salvos no seu navegador. Ao entrar na conta, eles são sincronizados com o seu perfil.</P>
        <H>Seus direitos</H>
        <P>Você pode pedir a correção ou exclusão dos seus dados a qualquer momento pelo e-mail {siteConfig.email}, conforme a LGPD.</P>
      </>
    ),
  },
  termos: {
    title: "Termos de uso",
    heading: "Terms",
    description: "Condições de uso da loja.",
    body: (
      <>
        <P>Os preços e a disponibilidade são confirmados no momento da finalização do pedido. Em caso de divergência, vale o valor calculado no checkout.</P>
        <P>Cupons de desconto não são cumulativos e podem ter limite de uso, valor mínimo e validade.</P>
        <P>Esta é uma loja de demonstração: os pagamentos são processados em ambiente de teste e nenhuma cobrança real é realizada.</P>
      </>
    ),
  },
};
