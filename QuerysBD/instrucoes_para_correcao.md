# Instruções para Correção do Erro na Página de Perfil

## Problema Identificado

Ao analisar os logs de erro, identifiquei que o problema está relacionado à coluna `address` que está sendo referenciada no código, mas não existe na tabela `profiles` do Supabase:

```
[perfil] Erro ao atualizar perfil: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'address' column of 'profiles' in the schema cache"}
```

## Solução em Duas Etapas

### 1. Modificações no Código JavaScript (Já Implementadas)

Modifiquei o código JavaScript para:
- Remover temporariamente a referência à coluna `address` nas operações de upsert/insert no Supabase
- Manter o armazenamento do endereço no localStorage para preservar os dados do usuário
- Garantir que o perfil seja salvo com os outros campos (nome, telefone) sem problemas

### 2. Adicionar a Coluna no Supabase (Necessário Executar)

Para resolver o problema permanentemente, é necessário adicionar a coluna `address` à tabela `profiles` no Supabase:

1. Faça login no painel de administração do Supabase
2. Vá para a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `add_address_column.sql` que criei
5. Execute a consulta

O SQL verifica se a coluna já existe e, se não existir, a adiciona à tabela.

## Após Adicionar a Coluna

Depois de adicionar a coluna `address` no Supabase, você pode descomentar as linhas relacionadas ao endereço no arquivo `paginadeperfil.html`:

1. Procure por estas linhas no código:
```javascript
// Adicionar endereço se fornecido - comentado por enquanto devido ao erro
// Para reativar após adicionar a coluna no Supabase
// if (endereco) {
//   updates.address = endereco;
// }
```

2. Descomente-as para que fiquem assim:
```javascript
// Adicionar endereço se fornecido
if (endereco) {
  updates.address = endereco;
}
```

3. Faça o mesmo para o bloco similar na função de inserção de perfil.

## Verificação

Após executar essas etapas, você deve ser capaz de salvar o perfil completo, incluindo o endereço, sem erros.
