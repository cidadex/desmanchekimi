# Escopo e Especificações Técnicas: Central dos Desmanches

## 1. Resumo do Projeto
A **Central dos Desmanches** é uma plataforma marketplace (modelo classificados/leads) que conecta desmanches (ferro-velhos) credenciados pelo Detran a clientes finais (pessoas físicas, oficinas mecânicas) e a outros desmanches que buscam peças automotivas, náuticas e aeronáuticas. 

O foco principal da plataforma é **segurança, procedência e geração de leads qualificados**, garantindo que apenas peças legais e empresas regularizadas participem do ecossistema, conectando compradores e vendedores rapidamente.

---

## 2. Modelo de Negócio e Monetização
A plataforma opera exclusivamente no modelo **SaaS (Software as a Service) por Assinatura**.
* **Assinatura Mensal/Anual:** O desmanche paga um valor fixo e recorrente para ter acesso à plataforma, visualizar o Mural de Pedidos, receber leads e enviar propostas.
* **Sem Retenção de Pagamentos:** A plataforma **não** processa o pagamento das peças, não cobra comissionamento sobre vendas e não faz intermediação ou retenção (escrow) de valores entre comprador e vendedor. Toda a negociação financeira (pagamento da peça e frete) ocorre externamente, diretamente entre o cliente e o desmanche.

---

## 3. Painéis e Perfis de Acesso

A plataforma é dividida em 3 ambientes distintos (Painéis):

### 3.1. Painel Administrativo (Master)
Área restrita aos gestores da plataforma. Responsável pelo controle total da operação.
* **Visão Geral (Dashboard):** Métricas em tempo real (usuários ativos, pedidos criados, desmanches online, aprovações pendentes).
* **Gestão de Desmanches:** Lista de todos os parceiros, status do credenciamento, validade da documentação do Detran.
* **Gestão de Usuários:** Controle de clientes finais (pessoas físicas e jurídicas/oficinas).
* **Anúncios e Pedidos:** Moderação das cotações criadas e monitoramento do volume de negociações.
* **Central de Leilões:** Gestão de lotes capturados (scraping) ou integrados via parceiros (Detran/Leiloeiros).
* **Financeiro Interno:** Controle de assinaturas ativas, mensalidades pagas e inadimplentes (mensalidades do portal).
* **Aprovações (Onboarding):** Fluxo rigoroso de aprovação de novos desmanches (checagem de alvará, CNPJ, certidão Detran).

### 3.2. Painel do Desmanche (Parceiro Vendedor)
Ambiente de trabalho do lojista (Ferro-velho).
* **Mural de Pedidos (Lead Board):** Feed em tempo real onde caem as solicitações de peças dos clientes. Possui filtros (carros, motos, urgente, cliente final ou parceiro comercial).
* **Detalhes do Pedido:** Visualização rica da necessidade do cliente (descrição detalhada, fotos, urgência).
* **Minhas Negociações:** Histórico de propostas enviadas e contatos iniciados. Acompanhamento de quais negociações estão com chat liberado e em andamento.
* **Minha Documentação:** Área para manter os laudos e certidões do Detran sempre atualizados (com alertas de vencimento). A inadimplência documental bloqueia o acesso aos leads.
* **Assinatura e Faturas:** Gestão do plano de assinatura da plataforma (pagamento da mensalidade para acesso ao sistema).

### 3.3. Painel do Usuário/Comprador (A Ser Desenvolvido)
Ambiente do cliente final (PF ou Oficina).
* **Meus Pedidos de Peças:** Histórico de cotações abertas.
* **Mural de Propostas:** Caixa de entrada onde ele recebe os orçamentos (preço da peça, frete e condições) dos desmanches credenciados.
* **Avaliações:** Sistema para avaliar o atendimento e a qualidade da peça fornecida pelo desmanche, criando um ranking de reputação na plataforma.

---

## 4. Regras de Negócio Core (Motor da Plataforma)

1. **Barreira de Credenciamento Rigorosa:** Nenhum desmanche pode acessar o Mural de Pedidos, visualizar cotações ou enviar propostas se não estiver com a documentação do Detran validada e ativa no sistema.
2. **Primeiro Contato Obrigatório via Portal (Anti-Bypass de Leads):** Para garantir o valor e a métrica da plataforma, o cliente não vê o telefone do desmanche e o desmanche não vê o telefone do cliente no primeiro momento. O desmanche **deve obrigatoriamente** enviar a primeira proposta (texto, valor sugerido) por dentro da plataforma. Apenas **após o envio dessa primeira mensagem**, o botão com o link do WhatsApp é destravado para que eles continuem a negociação livremente fora da plataforma.
3. **Parceria B2B (Atacado entre Desmanches):** Desmanches podem comprar de outros desmanches. Quando isso acontece, o pedido ganha uma tag "Pedido de Parceiro", sinalizando que a cotação espera preço de repasse (atacado), fomentando o network entre lojistas.
4. **Isenção de Responsabilidade Transacional:** A plataforma atua puramente como balcão de anúncios e geradora de conexões (Classificados/Leads). Transações financeiras, garantias, devoluções e envios logísticos são de responsabilidade exclusiva e direta entre o Desmanche Vendedor e o Cliente Comprador.
5. **Live Status (Ticker de Gatilho Mental):** A plataforma conta com um sistema na Home e no Painel Admin (estilo bolsa de valores), mostrando atividade em tempo real para gerar senso de urgência e prova social (ex: "X usuários online", "Y novos pedidos de peças hoje").

---

## 5. Front-end e UX/UI 
* **Stack Tecnológica:** Desenvolvido em React (Vite) + Tailwind CSS + shadcn/ui.
* **Design System:** Modo "Dark/Premium" nas Landing Pages para passar seriedade institucional, painéis "Light/Clean" focados em produtividade e leitura rápida de dados para os desmanches.
* **Responsividade Padrão:** Arquitetura responsiva total, focada na experiência do Desmanche que muitas vezes usa o celular dentro do pátio para responder propostas (navegação por menu "sanduíche" lateral e botões grandes).