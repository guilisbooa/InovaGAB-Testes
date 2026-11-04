# language: pt
Funcionalidade: Acompanhamento de projetos e resultados
  Como gestor
  Quero atualizar os indicadores de um projeto
  Para acompanhar os resultados da iniciativa

  Cenário: Criar projeto e atualizar indicadores de resultado
    Dado que o Firestore Emulator está disponível
    Quando cadastro um projeto na coleção "projects"
    Então a API deve responder com status 200
    E o documento retornado deve respeitar o contrato de projeto
    Quando consulto o projeto cadastrado
    Então a API deve responder com status 200
    Quando atualizo o progresso do projeto para 75 por cento e ROI 18
    Então a API deve responder com status 200
    E os indicadores atualizados devem ser retornados corretamente
    Quando excluo o projeto cadastrado
    Então a API deve responder com status 200
