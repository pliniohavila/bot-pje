# Bot PJE

Um _bot_ escrito em Javascript que, com base em uma lista de processo, acessa o PJE (Processo Judicial eletrônico), pesquisa e acessa os processos e devolve o valor da causa de cada um.

## Feito com:

* Javascript
* Puppeteer


## Requisistos para sua utilização

Este _bot_ foi feito para ser utilizado por advogado que já tenha sido cadastrado como representante processual. 
Caso não tenha, ele não irá funcionar pelo fato do PJE exibir uma alerta de acesso, o qual o _bot_ ainda não lida com esse alerta. 

O login no PJE é por meio de usuário e senha, não pelo _token_. Assim, é necessário que os dados de _login_ (CPF e senha) sejam assinalados no arquivo "_.env_". 

Foi construído voltado para o TJMG, não testei sua compatibilidade com o PJE de outros tribunais. 

## Para executar 

A lista de processos deve estar em arquivo "_.txt_" localizado na pasta "_/process_". 
Cada número de processo nesse arquivo deve estar em uma linha. Não pode existir qualquer simbolo além do número do processo. 

Exemplo:
```txt
5000000-40.2022.8.13.0556
5000000-46.2022.8.13.0556
5000000-91.2021.8.13.0556
```

```shel
node index.js
```

