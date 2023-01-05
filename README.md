# Bot PJE

Um _bot_ escrito em Javascript que, com base em uma lista de processo, acessa o PJE (Processo Judicial eletrônico), pesquisa e acessa os processos e devolve o valor da causa de cada um.

## Feito com:

* Javascript
* Puppeteer


## Requisistos para sua utilização

Este _bot_ foi feito para ser utilizado que já tenha sido cadastrados como representante processual. 
Caso não tenha, ele não irá funcionar pelo fato do PJE exibir uma alerta de acesso, o qual o bot ainda não lida com esse alerta. 

O login no PJE é por meio de usuário e senha, não pelo _token_. Assim, é necessário que os dados de _login_ (CPF e senha) sejam assinalados no arquivo "_.env_". 

Foi construído voltado para o TJMG, não testei sua compatibilidade com o PJE de outros tribunais. 

## Para executar 

```shel
node index.js
```

