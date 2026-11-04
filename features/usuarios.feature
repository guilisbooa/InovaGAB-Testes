# language: pt
Funcionalidade: Perfil de usuário no Firestore
  Como usuário autenticado
  Quero consultar meu perfil
  Para visualizar meus dados e meu nível de participação

  Cenário: Criar e consultar um perfil de operador
    Dado que o Firestore Emulator está disponível
    Quando cadastro um usuário na coleção "users"
    Então a API deve responder com status 200
    E o perfil retornado deve conter os dados do usuário
    Quando atualizo a pontuação do usuário para 60
    Então a API deve responder com status 200
    Quando consulto o perfil cadastrado
    Então a API deve responder com status 200
