# VANTA — Beyond the ordinary.

E-commerce full stack de uma marca fictícia de streetwear premium. Loja completa (catálogo, produto, carrinho, checkout, conta do cliente, favoritos) e painel administrativo (dashboard com dados reais, produtos, variações, estoque, pedidos, clientes, cupons), construídos com Next.js 16, TypeScript, Tailwind CSS 4, Drizzle ORM, Supabase e Stripe.

O projeto roda **sem nenhuma configuração**: sem credenciais, ele entra em modo demonstração com banco Postgres embutido (PGlite), autenticação local e checkout simulado. Com as variáveis de ambiente preenchidas, passa a usar Supabase (Postgres, Auth e Storage) e Stripe em modo de teste — sem mudar uma linha de código.

---

## Sumário

- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Início rápido (modo demonstração)](#início-rápido-modo-demonstração)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Configuração do Supabase](#configuração-do-supabase)
- [Configuração do banco](#configuração-do-banco)
- [Pagamentos com Stripe (teste)](#pagamentos-com-stripe-teste)
- [Deploy](#deploy)
- [Arquitetura](#arquitetura)
- [Segurança](#segurança)
- [Scripts](#scripts)
- [Decisões técnicas](#decisões-técnicas)

---

## Tecnologias

| Camada | Escolha |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Turbopack) |
| Linguagem | TypeScript (strict) |
| UI | React 19, Tailwind CSS 4, componentes no padrão shadcn/ui sobre Radix UI, Lucide Icons |
| Tipografia | Archivo Variable (eixo de largura expandido) para títulos, Geist Sans para texto |
| Formulários | React Hook Form + Zod (os mesmos schemas validam no cliente e no servidor) |
| Banco | PostgreSQL via Drizzle ORM — Supabase em produção, PGlite (Postgres em WASM) no modo demo |
| Autenticação | Supabase Auth (`@supabase/ssr`) ou autenticação local (bcrypt + JWT em cookie httpOnly) |
| Arquivos | Supabase Storage ou pasta local `.data/uploads` |
| Pagamentos | Stripe Checkout em modo de teste ou checkout simulado |
| Estado no cliente | Zustand (carrinho e favoritos persistidos em `localStorage`) |
| Gráficos | Recharts |
| Notificações | Sonner |

## Funcionalidades

### Loja
- **Home** com hero cinematográfico ("BEYOND THE ORDINARY" + SHOP NOW), New arrivals, Best sellers, Shop by category, campanha editorial, banner de coleção, newsletter funcional (salva no banco) e footer completo.
- **Header** com navegação, busca com sugestões ao vivo, favoritos, conta e carrinho com contador animado; transparente sobre o hero e com menu lateral no mobile.
- **Catálogo** (`/shop`, `/shop/[categoria]`) com filtros combináveis por categoria, tamanho, cor, faixa de preço, disponibilidade, promoção e lançamentos; busca; ordenação (mais recentes, menor/maior preço, mais vendidos); filtros na URL (compartilháveis); chips de filtros ativos; paginação; skeleton loading.
- **Cards** com troca de imagem no hover, selos de novo/promoção/esgotado, amostras de cor, favoritar e adicionar rápido (direto para produtos de variação única, ou via modal de visualização rápida).
- **Página de produto** com galeria (carrossel no mobile, grade editorial no desktop), visualização ampliada com zoom, troca de imagens por cor, seleção de cor e tamanho com estoque por combinação, aviso de últimas unidades, quantidade limitada ao estoque, bloqueio de compra sem tamanho, guia de tamanhos, envio, trocas, produtos relacionados, "Complete the look" e dados estruturados (JSON-LD).
- **Carrinho** em gaveta lateral e página própria: alterar quantidade, trocar tamanho/cor no próprio item, remover, cupom, estimativa de frete por CEP, totais recalculados no servidor, avisos de estoque e estado vazio. Persistido no navegador e, para clientes logados, também no banco.
- **Checkout** com identificação, CPF validado, autopreenchimento de endereço pelo CEP (ViaCEP), método de entrega, cupom, resumo e pagamento (Stripe teste ou simulado, sempre identificado como tal).
- **Confirmação do pedido** com número, itens, totais, endereço, pagamento, barra de progresso e histórico de status. Visitantes acessam por um link com token secreto.

### Conta do cliente
Cadastro, login, logout, recuperação e redefinição de senha, perfil (nome, telefone, CPF), troca de senha, endereços (CRUD com endereço padrão), histórico de pedidos e favoritos. Rotas protegidas por proxy e verificação no servidor.

### Favoritos
Funcionam para visitantes (salvos no navegador) e são **mesclados à conta no login**; para usuários logados, persistem no banco. Página de favoritos com adicionar ao carrinho.

### Painel administrativo (`/admin`)
- **Visão geral** com período selecionável (7, 30, 90 dias, 12 meses): receita, pedidos pagos, ticket médio (com variação vs. período anterior), produtos vendidos, variações com estoque baixo e clientes; gráficos de receita diária, pedidos por dia, produtos mais vendidos, distribuição por status e evolução mensal; pedidos recentes e alertas de estoque. Todos os números vêm do banco.
- **Estado vazio** com botão para gerar um histórico fictício de 150 dias (pedidos e clientes `@demo.vanta.store`), removível com um clique.
- **Produtos**: listagem com busca e filtros (categoria, status, promoção, estoque baixo/esgotado), alternância rápida de ativo/novo/mais vendido/destaque, criação, edição e exclusão. O formulário monta a matriz de variações (tamanho × cor) com SKU e estoque, preço e preço promocional, upload de imagens (ou URL) com cor associada, ordem e texto alternativo.
- **Categorias**, **tamanhos e cores**, **cupons** (percentual, valor fixo, frete grátis; pedido mínimo, limite de usos e validade).
- **Pedidos**: abas por status com contadores, busca por número/nome/e-mail, filtro por período, paginação, detalhes completos e mudança de status com regras de transição. Cancelar devolve o estoque e estorna o uso do cupom.
- **Clientes**: busca, segmentos (com/sem pedidos, administradores), ordenação por valor gasto ou pedidos, perfil com dados cadastrais, endereços, histórico e métricas; conceder/remover acesso de administrador.

### Qualidade
Responsivo do smartphone ao desktop, alvos de toque ≥ 40px, foco visível, `prefers-reduced-motion`, HTML semântico, metadata e Open Graph por página, imagem OG gerada, sitemap e robots dinâmicos, URLs amigáveis, `next/image`, cabeçalhos de segurança.

---

## Início rápido (modo demonstração)

Requisitos: **Node.js 20.9+**.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Na primeira requisição o banco embutido é criado em `.data/pglite`, as migrações rodam e o catálogo é populado (12 produtos, 6 categorias, 154 variações, cupons).

Contas de demonstração (também disponíveis como atalhos na tela de login):

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@vanta.store` | `vanta-admin` |
| Cliente | `cliente@vanta.store` | `vanta1234` |

Cupons de teste: `VANTA10` (10%), `BEYOND50` (R$ 50 acima de R$ 400), `FRETEGRATIS`.

Para recomeçar do zero: `npm run db:reset` (com o servidor parado).

> No modo demo não há provedor de e-mail: o link de redefinição de senha aparece na tela e no console do servidor. Pagamentos são simulados e marcados como tal em todo o sistema — nenhuma cobrança é feita.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Todas são opcionais.

| Variável | Uso | Exposta ao navegador |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública (sitemap, Open Graph, retorno do Stripe) | sim |
| `AUTH_SECRET` | Assina o cookie de sessão do modo demo. Gere com `openssl rand -base64 32` | não |
| `DATABASE_URL` | Connection string do Postgres (Supabase). Ausente → PGlite | não |
| `PGLITE_DIR` | Pasta do banco embutido (padrão `.data/pglite`) | não |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (protegida pelas políticas RLS) | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Upload de imagens no Storage. **Somente servidor** | não |
| `SUPABASE_STORAGE_BUCKET` | Bucket das imagens (padrão `product-images`) | não |
| `STRIPE_SECRET_KEY` | Chave secreta **de teste** (`sk_test_…`). Chaves live são ignoradas | não |
| `STRIPE_WEBHOOK_SECRET` | Segredo do endpoint de webhook | não |

O que cada combinação ativa:

| Configurado | Banco | Login | Imagens | Pagamento |
|---|---|---|---|---|
| nada | PGlite | local | `.data/uploads` | simulado |
| `DATABASE_URL` | Supabase Postgres | local | `.data/uploads` | simulado |
| + chaves Supabase | Supabase Postgres | Supabase Auth | Supabase Storage | simulado |
| + `STRIPE_SECRET_KEY` | — | — | — | Stripe Checkout (teste) |

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → Database**, copie a connection string do **Transaction pooler** (porta 6543) para `DATABASE_URL`, trocando `[YOUR-PASSWORD]` pela senha do banco.
3. Em **Project Settings → API**, copie `Project URL`, `anon public` e `service_role` para as variáveis correspondentes.
4. Em **Authentication → URL Configuration**, defina o *Site URL* (ex.: `http://localhost:3000`) e adicione `http://localhost:3000/auth/callback` (e o equivalente em produção) às *Redirect URLs*.
5. Rode as migrações e o seed (próxima seção). O script também aplica `supabase/policies.sql`: RLS em todas as tabelas, trigger que cria o perfil de cada novo usuário, função `is_admin()` e o bucket público `product-images`.
6. Crie sua conta pelo site (`/register`) e promova-a a administradora:

```bash
npm run admin:promote -- voce@email.com
```

## Configuração do banco

```bash
npm run db:migrate   # aplica as migrações do Drizzle (+ políticas do Supabase, se for o caso)
npm run db:seed      # popula categorias, tamanhos, cores, produtos, variações, imagens e cupons
```

O schema fica em `src/server/db/schema.ts` e as migrações SQL versionadas em `drizzle/`. Depois de alterar o schema:

```bash
npm run db:generate  # gera uma nova migração em drizzle/
npm run db:migrate
```

Entidades: `profiles`, `addresses`, `categories`, `sizes`, `colors`, `products`, `product_images`, `product_variants` (estoque por tamanho × cor), `inventory_movements` (auditoria de estoque), `carts`, `cart_items`, `favorites`, `coupons`, `orders`, `order_items` (snapshot de nome, preço, tamanho e cor no momento da compra), `order_status_history`, `payments`, `newsletter_subscribers` e `password_reset_tokens` (modo demo). Valores monetários são inteiros em centavos.

## Pagamentos com Stripe (teste)

1. Copie a chave secreta de teste em **Developers → API keys** para `STRIPE_SECRET_KEY`.
2. Para receber os webhooks localmente:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o `whsec_…` exibido para `STRIPE_WEBHOOK_SECRET`. Em produção, crie um endpoint apontando para `https://seu-dominio/api/stripe/webhook` com os eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired`.

3. No checkout, use o cartão `4242 4242 4242 4242`, qualquer data futura e qualquer CVC.

Fluxo: o pedido é criado e o estoque reservado **antes** do redirecionamento; o Stripe hospeda a página de pagamento (nenhum dado de cartão passa pelo servidor); o webhook confirma o pagamento ou cancela o pedido e devolve o estoque quando a sessão expira (30 min). A página de confirmação também consulta a sessão, então o fluxo funciona mesmo sem webhook configurado no ambiente local.

## Deploy

### Vercel + Supabase (recomendado)

1. Configure o Supabase como acima e rode `npm run db:migrate && npm run db:seed` apontando para o banco de produção.
2. Importe o repositório na Vercel e cadastre as variáveis de ambiente (`NEXT_PUBLIC_SITE_URL` com o domínio final, `AUTH_SECRET`, `DATABASE_URL`, chaves do Supabase e do Stripe).
3. Faça o deploy. Atualize no Supabase as URLs de redirecionamento e, no Stripe, o endpoint de webhook.

> Em ambientes serverless, **sempre** configure `DATABASE_URL`: o banco embutido (PGlite) grava em disco local e serve apenas para desenvolvimento e demonstrações em servidor único.

### Servidor próprio / Docker

```bash
npm ci
npm run build
npm start
```

No modo demo, mantenha a pasta `.data/` em um volume persistente (banco e uploads) e rode um único processo.

## Arquitetura

```
src/
├── app/
│   ├── (store)/              # loja: home, shop, products, cart, checkout, order, favorites, help
│   │   ├── (auth)/           # login, register, forgot-password, reset-password
│   │   └── account/          # perfil, pedidos, endereços (protegido)
│   ├── admin/                # painel com layout próprio (somente admin)
│   ├── api/stripe/webhook/   # webhook verificado por assinatura
│   ├── auth/callback/        # troca do código do Supabase por sessão
│   ├── uploads/[...path]/    # imagens enviadas no modo demo
│   ├── sitemap.ts, robots.ts, opengraph-image.tsx
├── components/
│   ├── ui/                   # primitivos (button, input, sheet, dialog, accordion…)
│   ├── layout/               # header, footer, menu mobile, busca, sincronização da conta
│   ├── store/                # cards, galeria, compra, carrinho, checkout, filtros
│   ├── account/  auth/  admin/
├── config/                   # env validado, site, status de pedido, páginas de ajuda
├── hooks/                    # cotação do carrinho, favoritos, ViaCEP, hidratação
├── lib/                      # formatação BRL/CPF/CEP, preços, validadores, utils
├── schemas/                  # Zod: checkout, auth, conta, admin
├── server/
│   ├── db/                   # schema Drizzle, cliente (Postgres/PGlite), seed
│   ├── auth/                 # sessão e serviços (Supabase ou local)
│   ├── services/             # regras de negócio: catálogo, preço do carrinho, frete, cupons, pedidos…
│   │   └── admin/            # dashboard, catálogo, pedidos, clientes, dados demo
│   ├── actions/              # server actions finas: validam, autorizam e chamam services
│   ├── payments/             # Stripe e simulado atrás da mesma interface
│   ├── storage/              # Supabase Storage ou disco local
├── stores/                   # Zustand: carrinho, favoritos, quick view
├── types/
└── proxy.ts                  # refresh de sessão Supabase e guarda de rotas
scripts/                      # migrate, seed, reset, promote-admin, gerador das artes dos produtos
supabase/policies.sql         # RLS, trigger de perfil, bucket de imagens
drizzle/                      # migrações SQL
```

Componentes de interface não contêm regra de negócio: eles chamam *server actions*, que validam a entrada com Zod, verificam permissão e delegam aos *services*.

## Segurança

- **Preço, desconto, frete e estoque são sempre calculados no servidor** (`server/services/cart-pricing.ts`). O navegador envia apenas IDs de variação e quantidades; preços enviados pelo cliente nunca são lidos.
- **Estoque à prova de concorrência**: a reserva usa `UPDATE … SET stock = stock - n WHERE stock >= n` dentro de uma transação; se qualquer item falhar, o pedido inteiro é desfeito. O uso de cupons com limite é incrementado da mesma forma.
- **Autorização em camadas**: o proxy barra visitantes em `/account` e `/admin`; os layouts verificam a sessão; **toda server action administrativa chama `assertAdmin()`**; o papel do usuário é lido do banco a cada requisição.
- **RLS no Supabase**: todas as tabelas têm políticas — catálogo público somente leitura, dados do cliente restritos ao dono, pedidos sem inserção pela API pública, cupons e estoque somente para admins, e trigger impedindo autopromoção de papel.
- **Pagamentos**: apenas chaves `sk_test_` são aceitas; dados de cartão ficam no Stripe; webhooks são verificados por assinatura.
- **Sessões**: cookies `httpOnly`, `sameSite=lax`, `secure` em produção; senhas com bcrypt; mensagem de erro de login genérica; tokens de redefinição com hash, uso único e validade de 30 min.
- **Pedidos de visitantes** só são acessíveis com um token aleatório de 192 bits, comparado em tempo constante.
- **Uploads** validados por tipo e tamanho (5 MB); caminho protegido contra *path traversal*.
- Chaves privadas (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `AUTH_SECRET`, `DATABASE_URL`) nunca são importadas por componentes de cliente.
- Cabeçalhos `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run typecheck` | checagem de tipos |
| `npm run db:generate` | gera migração a partir do schema |
| `npm run db:migrate` | aplica migrações (e políticas do Supabase) |
| `npm run db:seed` | popula o catálogo |
| `npm run db:reset` | apaga o banco embutido (modo demo) |
| `npm run admin:promote -- email` | concede acesso de administrador |
| `npm run art:generate` | regenera as ilustrações dos produtos em `public/images/products` |

> Com o banco embutido, rode os scripts com o servidor parado: o PGlite aceita um processo por vez.

## Decisões técnicas

- **Drizzle em vez de Prisma.** O briefing pedia Prisma "se compatível com a arquitetura". O requisito de funcionar sem credenciais levou a um Postgres embutido (PGlite), e o Drizzle roda o mesmo schema e as mesmas queries tanto no PGlite quanto no Supabase, sem engine binária e com SQL transparente para transações e updates condicionais de estoque.
- **Imagens dos produtos.** As fotos de produto são renders vetoriais gerados por script (`scripts/generate-product-art.ts`): uma vista frontal e uma traseira para cada cor, o que torna a troca de cor e o hover fiéis à variação escolhida. As fotos editoriais (hero, campanha, banner) vêm do Unsplash e são exibidas em preto e branco; se não carregarem, a página mostra um painel grafite no lugar. No admin, basta enviar fotos reais para substituir qualquer imagem.
- **Frete.** A estimativa usa uma tabela própria por região do CEP (`server/services/shipping.ts`), sem fingir uma cotação de transportadora. Para integrar Correios ou Melhor Envio, substitua `quoteShipping` — todo o resto já passa por ela.
- **E-mails transacionais** não estão implementados. Com Supabase, os e-mails de confirmação e recuperação de senha são enviados pelo próprio Supabase Auth.

---

VANTA é uma marca fictícia criada para portfólio. Fotografias editoriais: [Unsplash](https://unsplash.com/license).
