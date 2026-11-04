# language: pt
Funcionalidade: Autenticação de usuários do InovaGAB
  Como colaborador da plataforma
  Quero autenticar minha conta
  Para acessar as funcionalidades conforme meu perfil

  Cenário: Cadastro e login de um usuário válido
    Dado que o serviço Firebase Authentication está disponível
    Quando cadastro um usuário com e-mail "operador@inovagab.test" e senha "InovaGAB@123"
    Então a API deve responder com status 200
    E a resposta deve conter um identificador de usuário e um token
    Quando realizo login com as mesmas credenciais
    Então a API deve responder com status 200
    E a resposta de login deve conter um token de autenticação

  Cenário: Tentativa de login com senha incorreta
    Dado que existe uma conta de teste com e-mail "falha@inovagab.test"
    Quando tento autenticar essa conta com uma senha incorreta
    Então a API deve responder com status 400
    E a resposta deve informar erro de autenticação
