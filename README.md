# Sistema de chat online

Sistema de chat com a API feita em PHP e banco de dados MySQL, e a view feita em React.js.

## Como rodar?

Para rodar, você primeiro deve ter instalado o PHP e o MySQL. Além disso, deve ter também o npm e o Composer para dar os comandos e baixar as dependências.

Depois de instalar os pacotes de dependências com Composer e npm, você deve configurar a API para evitar erros de CORS. Caso esteja usando PHP instalado direto na sua máquina, descomente o topo do arquivo e exclua o `.htaccess`. Se estiver usando Apache, o `.htaccess` já está configurado e não terá problemas.

Por fim, configure o arquivo `config.jsx` na view para colocar o caminho correto da API.
