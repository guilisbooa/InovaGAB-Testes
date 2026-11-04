# language: pt
Funcionalidade: Registro e consulta de ideias
  Como operador
  Quero registrar uma ideia de melhoria
  Para contribuir com a inovação corporativa

  Cenário: Criar, consultar e excluir uma ideia
    Dado que o Firestore Emulator está disponível
    Quando cadastro uma ideia na coleção "ideas"
    Então a API deve responder com status 200
    E o documento retornado deve respeitar o contrato de ideia
    Quando consulto a ideia cadastrada
    Então a API deve responder com status 200
    E os dados da ideia devem ser os mesmos enviados
    Quando atualizo a prioridade da ideia para "high"
    Então a API deve responder com status 200
    E a prioridade da ideia deve ser "high"
    Quando excluo a ideia cadastrada
    Então a API deve responder com status 200
    E a consulta posterior deve retornar status 404
