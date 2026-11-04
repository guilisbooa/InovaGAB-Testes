# language: pt
Funcionalidade: Gerenciamento de orientações estratégicas
  Como liderança
  Quero cadastrar, consultar, atualizar e excluir orientações
  Para manter o direcionamento estratégico disponível aos colaboradores

  Cenário: Criar, atualizar e excluir uma orientação
    Dado que o Firestore Emulator está disponível
    Quando cadastro uma orientação na coleção "strategies"
    Então a API deve responder com status 200
    E a orientação retornada deve respeitar o contrato
    Quando consulto a orientação cadastrada
    Então a API deve responder com status 200
    Quando atualizo a descrição da orientação
    Então a API deve responder com status 200
    E a orientação deve apresentar a descrição atualizada
    Quando excluo a orientação cadastrada
    Então a API deve responder com status 200
