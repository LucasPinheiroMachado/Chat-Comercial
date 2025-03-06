# Sistema de chat comercial

Sistema de chat com a API feita em PHP e banco de dados MySQL, e a view feita em React.js.

## Como rodar?

Para rodar, você primeiro deve ter instalado o PHP e o MySQL. Além disso, deve ter também o npm e o Composer para dar os comandos e baixar as dependências.

Depois de instalar os pacotes de dependências com Composer e npm, você deve configurar a API para evitar erros de CORS. Caso esteja usando PHP instalado direto na sua máquina, descomente o topo do arquivo e exclua o `.htaccess`. Se estiver usando Apache, o `.htaccess` já está configurado e não terá problemas. Para produção configure o `.htaccess` como for necessário.

Por fim, configure o arquivo `config.jsx` na view para colocar o caminho correto da API.

## OBS:

### Restrição

A view só permite criar usuários do tipo "standard" para criar do tipo "admin" rode direto do SQL.

### Regras de negócio

1: Um "admin" pode coversar com qualquer usuário, porém um "standard" só pode conversar com um "admin".
2: O login é único, então um usuário não pode ter o mesmo login que outro.
