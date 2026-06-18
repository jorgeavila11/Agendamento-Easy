# Arquitetura, Wireframes e Guia de Deploy: Agenda Fácil

Este documento apresenta as especificações do sistema de agendamento online **Agenda Fácil**, cobrindo o design de arquitetura SaaS, os diagramas informais (wireframes) e o roteiro definitivo para ativação e deploy em ambiente de produção no **Firebase**.

---

## 1. Arquitetura Completa do SaaS

O **Agenda Fácil** foi desenhado seguindo premissas de Serverless altamente escalável. Ele separa totalmente os fluxos de administração (profissionais autônomos/pequenos negócios) e o portal aberto para clientes.

```
       +-------------------------------------------------------------+
       |                        CAMADA CLIENT                         |
       +-------------------------------------------------------------+
            | (Submissão de Slot)                       | (Gerenciamento)
            v                                           v
  +-------------------+                       +----------------------+
  | PORTAL DE CLIENTE |                       | PAINEL ADMINISTRADO  |
  |     (Público)     |                       |    (Seguro / Auth)   |
  +-------------------+                       +----------------------+
            |                                           |
            v                                           v
+--------------------------------------------------------------------+
|               FIREBASE CORE ENGINE (Serverless SaaS)               |
+--------------------------------------------------------------------+
  | - Firebase Auth   : Controle seguro de sessões e logins
  | - Cloud Firestore : Banco NoSQL real-time (Esquema por Workspace)
  | - Cloud Functions : Triggers transacionais automáticos
  | - CDN Hosting     : Distribuição global com caching de assets
+--------------------------------------------------------------------+
```

### Mecânica de Link Público (`agenda.facil/{publicSlug}`)
- Cada usuário profissional cria e personaliza seu próprio prefixo (`publicSlug`).
- O portal de agendamentos consulta as coleções do Firestore vinculadas exclusivamente ao ID do profissional dono da URL. Ele calcula horários ocupados e intervalos em tempo de execução, garantindo **Zero Conflitos de Agenda**.

---

## 2. Estrutura de Pastas do Projeto

Abaixo está o design modular de diretórios do repositório:

```
/
├── firebase.json              # Configurações do Hosting, Firestore e Functions
├── firestore.rules            # Regras de segurança matemáticas (Zero-Trust)
├── firebase-blueprint.json    # Mapeamento do esquema IR das coleções
├── security_spec.md           # Definição técnica dos testes de segurança
├── package.json               # Gerenciador de dependências Vite/React
├── functions/
│   ├── index.js               # Triggers de agendamentos e consolidação de clientes
│   └── package.json           # Dependências internas do Cloud Functions
├── src/
│   ├── main.tsx               # Ponto de ancoragem da aplicação
│   ├── App.tsx                # Controladora de abas, navegação e views
│   ├── index.css              # Customização de temas e animações Tailwind
│   ├── types.ts               # interfaces TypeScript e Enums compartilhados
│   ├── context/
│   │   └── FirebaseContext.tsx # Central de Gerenciamento de Estado (SaaS)
│   └── components/
│       ├── Dashboard.tsx      # Métricas, fila de hoje e walk-in manual
│       ├── ServicesManager.tsx # Manipulação de catálogo e gaveta de novos serviços
│       ├── ScheduleSettings.tsx # Calendário semanal e blocos de exclusão
│       └── ProfileSettings.tsx  # Slugs públicos, contatos e bios customizadas
```

---

## 3. Wireframes dás Telas (Aesthetic Blueish Dark Theme)

### Tela A: Painel Administrativo (Dashboard)
```
+------------------------------------------------------------------------------+
| [AF] Agenda Fácil | SaaS |                    [ Painel Admin ] [ Ver Link v ] |
+------------------------------------------------------------------------------+
|  (Sidebar)        |  Olá, Juliana Costa!                                     |
|  [DASHBOARD]      |  +----------------------------------------------------+  |
|  [SERVIÇOS]       |  | Hoje: 4 Slots | Pendentes: 2 | Total Clientes: 12  |  |
|  [COMPROMISSOS]   |  +----------------------------------------------------+  |
|  [MEU LINK]       |                                                          |
|                   |  Agendamentos Solicitados:        [ + Novo Agendamento ] |
|  Link Público:    |  +----------------------------------------------------+  |
|  agenda.facil/    |  | Sarah Jenkins - Corte Premium (09:00) [Confirmar]  |  |
|  studio-essence   |  | Mariana Silva - Colorização   (14:00) [ Cancelar]  |  |
|  [Testar Link]    |  +----------------------------------------------------+  |
+------------------------------------------------------------------------------+
```

### Tela B: Portal de Agendamento do Cliente (Link Público)
```
+------------------------------------------------------------------------------+
| [SE] Studio Essence  (Juliana Costa - Jardins, SP)                           |
| Especialista em bem-estar e estética corporal.                               |
+------------------------------------------------------------------------------+
| 1. Selecione o Serviço         | 2. Escolha o Dia   | 3. Escolha o Horário   |
| +----------------------------+ | +----------------+ | +--------------------+ |
| | [x] Corte Premium R$ 85    | | | SEG | TER | QUA| | | (09:00)  (09:30)   | |
| | [ ] Sobrancelha   R$ 120   | | | 15  | 16  | 17 | | | (10:00)  [ocupado] | |
| | [ ] Manicure      R$ 65    | | | (x) | ( ) | ( )| | | (11:00)  (11:30)   | |
| +----------------------------+ | +----------------+ | +--------------------+ |
|                                                                              |
|  [ Confirmar Reserva: Terça-feira, 16 de Junho às 09:00 ]                    |
+------------------------------------------------------------------------------+
```

---

## 4. Plano de Deploy Detalhado no Firebase

Siga este roteiro passo a passo para colocar a aplicação em produção real:

### Passo 1: Instale o Firebase CLI Globalmente
Caso ainda não tenha instalado as ferramentas do Firebase:
```bash
npm install -g firebase-tools
```

### Passo 2: Autenticação no Terminal
Efetue o login com a conta Google vinculada aos seus projetos:
```bash
firebase login
```

### Passo 3: Inicialização do Workspace
No diretório raiz da sua aplicação, execute o assistente de conexão:
```bash
firebase init
```
*Selecione os seguintes recursos utilizando a barra de espaço:*
1.  **Firestore**: Configura o banco de dados e regras de segurança.
2.  **Functions**: Cria o escopo para triggers em background.
3.  **Hosting**: Distribui sua SPA otimizada em produção.

---

### Passo 4: Configurando os Arquivos de Infraestrutura

#### `firebase.json` (Colocado na raiz do projeto)
Crie ou substitua o arquivo com o seguinte escopo clássico para SPAs React:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### Passo 5: Geração de Build de Produção
Antes de executar o deploy, compile todos os componentes TypeScript com otimização avançada:
```bash
npm run build
```
Isso gerará os arquivos estáticos de produção na pasta `dist/`.

---

### Passo 6: Publicação Completa em Produção
Execute o deploy de todos os recursos de uma única vez em poucos segundos:
```bash
firebase deploy
```

Se desejar realizar deploys específicos:
```bash
# Apenas Site Estático (Vite App)
firebase deploy --only hosting

# Apenas Regras de Segurança do Banco NoSQL
firebase deploy --only firestore:rules

# Apenas Triggers do Functions
firebase deploy --only functions
```

Após a conclusão com êxito, o terminal retornará a **Hosting URL** pública oficial para uso do seu SaaS!
