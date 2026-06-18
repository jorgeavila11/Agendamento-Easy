# Specification Security: Agenda Fácil

A segurança do Agenda Fácil é baseada em regras de Zero-Trust e Controle de Acesso por Atributos (ABAC) no Cloud Firestore.

## 1. Invariantes de Dados

- **Perfis de Usuários (`/users/{userId}`)**: Apenas o proprietário autenticado (`request.auth.uid == userId`) pode alterar ou ler suas informações privadas.
- **Serviços (`/users/{userId}/services/{serviceId}`)**: Apenas o dono da conta pode criar, editar ou desativar serviços. Clientes públicos podem apenas ler os serviços marcados como `active == true`.
- **Agendamentos (`/users/{userId}/appointments/{appointmentId}`)**:
  - Clientes públicos não-autenticados podem **CRIAR** agendamentos se respeitados os requisitos de estrutura de dados (nome, telefone válido, data futura, `status` inicial obrigatoriamente definido como `pending` ou `confirmed`).
  - Clientes públicos **NÃO** podem ler uma "lista" aberta de agendamentos (privacidade total de dados dos outros clientes). A leitura de lista é apenas para o proprietário autenticado.
  - O proprietário autenticado do workspace pode ler toda a lista de agendamentos e gerenciar o `status` (confirmar, cancelar).
  - Um agendamento cancelado no estado terminal não pode ser ressuscitado.

---

## 2. Payloads da "Dúzia Suja" (Dirty Dozen) que serão REJEITADOS

1. **Invasão de Workspace alheio:** Modificação das configurações de disponibilidade (`/users/user_A/schedules/config`) sendo autenticado como `user_B`. (Rejeita por UID incorreto).
2. **Escalação de Privilégios no Agendamento:** Criação de agendamento por parte do cliente público com o status final preenchido diretamente como `confirmed` burlador sem pagar ou sem consentimento, se o fluxo do profissional exigir aprovação, ou criar como `cancelled` diretamente.
3. **Roubo de Identidade Criador:** Criação de serviço com o campo `id` apontando para outro ID, ou alteração de dados do autor do registro.
4. **Campos Imutáveis Modificados:** Alteração do campo `createdAt` após a criação de um agendamento.
5. **Ataque Denial-of-Wallet (DDoS de ID):** Injeção de caracteres inválidos de tamanho enorme (ex: 2MB de strings lixo) no ID do documento de serviço ou agendamento (`id.size() > 128` ou com caracteres especiais).
6. **Envenenamento de Valor (Agendamento no Passado):** Envio de agendamento com data ou horário retroativo no payload, ou data formatada incorretamente.
7. **Quebra de Tipo de Dados:** Preenchimento de `price` como string ou booleano, ou `duration` como número negativo.
8. **Injeção de PII por Terceiros:** Leitura de dados pessoais de outros clientes que possuem agendamento no mesmo dia (`allow list` irrestrito sem checar pertencimento).
9. **Bypass de Bloqueio de Imutabilidade histórica:** Tentativa de atualizar um agendamento após o mesmo estar marcado como `status = 'cancelled'`.
10. **Apropriação Indébita de Slug de Link:** Cadastro de slug de link público que colide com sistema ou tenta se passar por outro usuário.
11. **Estouro de Lista Sem Limite:** Envio de array de datas bloqueadas de 1 milhão de posições para sobrecarregar a memória do Firestore (`size.blockedDates > 100`).
12. **Injeção de Tag JS/HTML em Descrição de Serviço:** Envio de tags em campos de texto sem restrição de tamanho de caracteres (> 10,000 bytes) para causar ataques de XSS no painel do administrador.

---

## 3. Estrutura de Testes Automatizada Recomendada

Abaixo está o design conceitual do validador de regras de segurança:

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

// Verificações que devem rejeitar com PERMISSION_DENIED:
// - Cadastro de agendamento com status terminal inicializado de forma fraudulenta.
// - Alteração do perfil do profissional por parte de outro utilizador não autenticado.
// - Obter a lista completa de clientes por outro usuário.
```
