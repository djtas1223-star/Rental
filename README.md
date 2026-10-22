# Comitiva dos Operadores SpreadHunter (Portal RentalHash)

Portal oficial da **Comitiva dos Operadores SpreadHunter**, desenvolvido para unificar demandas, identificar dúvidas semelhantes, registrar apoios da comunidade de operadores e dialogar de forma transparente com a diretoria da **RentalHash**.

---

## 🚀 Tecnologias

- **Framework**: Next.js 15 (App Router, React 19)
- **Estilização**: Tailwind CSS com design responsivo e acessível
- **Banco de Dados & Autenticação**: Supabase (PostgreSQL + RLS + GoTrue Auth)
- **Ícones**: Lucide React
- **Controle de Versão**: Git & GitHub (`https://github.com/djtas1223-star/Rental.git`)

---

## 📦 Estrutura do Banco de Dados (Supabase)

O schema está definido no arquivo `supabase/migrations/20250101000000_comitiva_schema.sql` e contempla as 8 tabelas solicitadas com Row Level Security (RLS) habilitado:

1. **`categorias`**: Segmentação de temas (Repasses & Pagamentos, Contratos & Regras, Máquinas & Hashrate, Suporte & Atendimento, Taxas & Custos, Geral).
2. **`questionamentos`**: Demandas cadastradas por operadores, com status de fluxo (`pendente`, `em_analise`, `encaminhado`, `respondido`, `concluido`, `rejeitado`), nível de impacto e contador atômico de apoios.
3. **`apoios`**: Sistema de votos/endossos com restrição única por operador (`uq_questionamento_eleitor`) para prevenção total de duplicidade de apoios.
4. **`historico_atualizacoes`**: Linha do tempo transparente de cada questionamento, registrando avanços de reuniões, mudanças de status e notas públicas da comitiva.
5. **`respostas_rentalhash`**: Respostas oficiais da empresa, com autor/representante, data de resposta, links para anexos comprobatórios e status de validação.
6. **`comunicados_comitiva`**: Mural geral de informes, atas de reuniões periódicas e avisos com suporte a fixação em destaque.
7. **`usuarios_administradores`**: Membros autorizados da comitiva com controle de papel (`admin`, `moderador`) e integração com `auth.users`.
8. **`logs_auditoria`**: Rastreabilidade completa de todas as alterações de status, criação de comunicados e respostas oficiais.

---

## 🔒 Segurança e Políticas de Row Level Security (RLS)

- **Acesso Público**: Visualização de questionamentos em andamento (`em_analise`, `encaminhado`, `respondido`, `concluido`), comunicados oficiais publicados e histórico público.
- **Inserção Pública**: Qualquer operador pode submeter uma nova dúvida (que entra com status `pendente` para triagem da comitiva) e registrar ou retirar apoio a uma demanda.
- **Acesso Administrativo**: Somente usuários cadastrados e ativos em `usuarios_administradores` podem aprovar demandas, mudar status para `encaminhado` ou `concluido`, publicar respostas oficiais da RentalHash e lançar comunicados.
- **Proteção de Segredos**: As chaves privadas (`service_role`) **nunca** são expostas no código cliente. Apenas a chave pública autorizada (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) é utilizada no frontend. O arquivo `.env.local` é ignorado no `.gitignore`.

---

## ⚙️ Como Configurar e Executar

### 1. Variáveis de Ambiente
Crie ou verifique o arquivo `.env.local` na raiz:
```env
NEXT_PUBLIC_SUPABASE_URL=https://plrytbbwjeomqkjgbdlb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_CEt85v6OMLrYIvjPaWk55A_PZntQZV2
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_CEt85v6OMLrYIvjPaWk55A_PZntQZV2
```

### 2. Aplicar a Migration no Supabase
1. Acesse o painel do Supabase do projeto: [https://supabase.com/dashboard/project/plrytbbwjeomqkjgbdlb/sql](https://supabase.com/dashboard/project/plrytbbwjeomqkjgbdlb/sql)
2. Abra o arquivo `supabase/migrations/20250101000000_comitiva_schema.sql`.
3. Cole o conteúdo no SQL Editor e execute (**Run**).

### 3. Instalar Dependências e Iniciar
```bash
npm install
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no navegador.

### 4. Build de Produção
```bash
npm run build
npm run start
```
