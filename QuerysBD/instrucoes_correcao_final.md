# Instruções para Correção Final do Erro na Página de Perfil

## Problema Identificado

O erro atual está relacionado à coluna `full_name` que está sendo referenciada no código, mas não existe na tabela `profiles` do Supabase:

```
[perfil] Erro ao atualizar perfil: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'full_name' column of 'profiles' in the schema cache"}
```

Isso sugere que a tabela `profiles` foi criada com uma estrutura diferente da esperada pelo código.

## Solução

### 1. Executar o Script SQL para Corrigir a Tabela

Criei um arquivo `corrigir_tabela_profiles.sql` que:
1. Verifica as colunas existentes na tabela `profiles`
2. Adiciona todas as colunas necessárias que estão faltando
3. Verifica novamente a estrutura da tabela após as alterações

Para executar:
1. Faça login no painel de administração do Supabase
2. Vá para a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `corrigir_tabela_profiles.sql`
5. Execute a consulta

### 2. Alternativa: Adaptar o Código para a Estrutura Existente

Se você preferir adaptar o código para a estrutura existente da tabela `profiles`, siga estas etapas:

1. Execute o seguinte SQL no Editor SQL do Supabase para verificar as colunas existentes:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles';
```

2. Modifique o código em `paginadeperfil.html` para usar os nomes corretos das colunas.

Por exemplo, se em vez de `full_name` a coluna se chamar `name`, você deve alterar:

```javascript
// De:
updates.full_name = nome;

// Para:
updates.name = nome;
```

E fazer o mesmo para todas as outras referências a nomes de colunas no código.

### 3. Verificar o Trigger de Criação Automática de Perfil

Se a tabela `profiles` existe mas está com estrutura diferente, pode ser que o trigger `handle_new_user` também esteja incorreto. Verifique e corrija se necessário:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Certifique-se de que o nome da coluna `full_name` corresponda ao nome real na tabela.

## Recomendação

A solução mais completa é executar o script `corrigir_tabela_profiles.sql`, pois ele garante que todas as colunas necessárias existam na tabela, mantendo a compatibilidade com o código existente.
