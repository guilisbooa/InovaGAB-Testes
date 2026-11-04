# InovaGAB — Testes Automatizados BDD e API

## 1. Objetivo
Este pacote complementa o aplicativo Android InovaGAB com testes automatizados em BDD (Gherkin) e testes HTTP para os serviços Firebase Authentication e Cloud Firestore utilizados pelo código-fonte.

O app original foi desenvolvido em Kotlin 1.9.22, Jetpack Compose, Firebase Authentication e Cloud Firestore, com arquitetura MVVM e repositórios para autenticação, ideias, projetos e orientações estratégicas.

## 2. Escopo e rastreabilidade
| Área | Operação exercitada | Cobertura nesta suíte |
|---|---|---|
| Firebase Authentication | accounts:signUp | Cadastro de usuário |
| Firebase Authentication | accounts:signInWithPassword | Login válido e inválido |
| Cloud Firestore | documents POST/GET/PATCH/DELETE | Ciclo de vida de ideias e projetos |
| Contratos | JSON Schema | Respostas de autenticação, documentos, ideias e projetos |
| BDD | Gherkin | 6 cenários: 2 de autenticação e 1 para cada coleção Firestore (`users`, `strategies`, `ideas`, `projects`) |

### Observação importante sobre APIs
O código-fonte entregue não contém um backend REST próprio em Java Spring ou C#. A aplicação acessa Firebase diretamente pelos SDKs `FirebaseAuth` e `FirebaseFirestore`. Por isso, os testes HTTP deste pacote exercitam os endpoints REST oficiais equivalentes dos emuladores Firebase, e não endpoints de uma API customizada inexistente no repositório.

A cobertura de Firestore representa as coleções identificadas no app (`users`, `strategies`, `ideas`, `projects`). Os cenários cobrem operações nas quatro coleções (`users`, `strategies`, `ideas`, `projects`), além de cadastro e login no Firebase Authentication. A suíte não reproduz integralmente todas as regras de negócio de XP, ranking ou autorização por perfil.

## 3. Execução com Docker
Pré-requisitos: Docker Desktop e Docker Compose.

Na pasta deste pacote:
```bash
docker compose up --build --abort-on-container-exit
```
O serviço `firebase` inicia os emuladores locais de Authentication (9099) e Firestore (8080). O serviço `tests` executa os cenários Cucumber.

Resultado esperado em uma execução sem falhas:
- 4 cenários aprovados;
- 4 cenários executados;
- validação de status HTTP;
- validação de campos JSON e JSON Schema.

Para encerrar:
```bash
docker compose down
```

## 4. Execução local
Com Node.js 20+ e Firebase CLI instalado:
```bash
npm install
firebase emulators:start --project demo-inovagab --only auth,firestore
```
Em outro terminal:
```bash
npm test
```

## 5. Estrutura
```text
features/
  autenticacao.feature
  ideias.feature
  projetos.feature
  step_definitions/steps.js
schemas/
  auth-signup.schema.json
  firestore-document.schema.json
  idea-fields.schema.json
  project-fields.schema.json
firebase.json
firestore.test.rules
Dockerfile
Dockerfile.tests
docker-compose.yml
```

## 6. Segurança do ambiente
`firestore.test.rules` permite leitura e escrita irrestritas apenas no emulador local para facilitar a execução isolada dos testes. Não publicar essas regras no Firebase de produção. O pacote original não trouxe o arquivo efetivo de Security Rules; portanto, a suíte não certifica as regras de autorização por perfil em produção.

## 7. Limitações e próximos testes recomendados
1. Incluir cenários de leitura/criação/edição/exclusão para `strategies` e `users`, inclusive ranking e atualização de XP.
2. Obter as Security Rules efetivamente utilizadas no projeto e testar operador, gestor e liderança com tokens distintos.
3. Acrescentar testes instrumentados Android para navegação, acessibilidade e interação nas telas Compose.
4. Executar a suíte em ambiente com Docker e anexar o relatório real do Cucumber. Este ambiente de preparação não dispõe de Docker; portanto, não foram produzidos resultados de execução fictícios.

## 8. Relação com ESG
- **Eficiência e sustentabilidade:** a solução permite registrar ideias de otimização de processos, consumo e custos. Os testes verificam persistência dos registros e indicadores de projetos.
- **Inclusão:** o app prevê perfis Operador, Gestor e Liderança; a documentação recomenda ampliar os testes de usabilidade e acessibilidade para diferentes perfis.
- **Governança:** os testes validam respostas HTTP, integridade de dados e contratos JSON. A validação efetiva de permissões depende das Security Rules de produção, ausentes no pacote recebido.

## 9. Evidências
As evidências de execução devem ser geradas ao rodar `docker compose up --build --abort-on-container-exit`. Como os testes não foram executados neste ambiente, este pacote não contém prints ou logs simulados. O relatório deve ser anexado após a execução real.
