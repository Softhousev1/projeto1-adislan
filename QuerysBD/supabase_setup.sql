-- Script para criar e configurar a tabela profiles no Supabase

-- 1. Criar a tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'public_user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Configurar políticas de segurança (RLS)
-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
-- Permitir que usuários vejam seus próprios perfis
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem ver seus próprios perfis" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Permitir que usuários atualizem seus próprios perfis
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Permitir que usuários insiram seus próprios perfis
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem inserir seus próprios perfis" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. Criar função de trigger para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para executar a função após registro de novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Criar bucket para armazenar imagens de perfil se não existir
-- Nota: Isso deve ser feito manualmente na interface do Supabase ou via API,
-- pois não é possível criar buckets diretamente via SQL
-- Após criar o bucket 'profiles', configure as seguintes políticas:

-- Para o bucket 'profiles', adicione as seguintes políticas:
-- 1. Permitir que usuários autenticados façam upload de arquivos:
--    SELECT policy_name FROM storage.policies;
--    INSERT INTO storage.policies (name, definition, bucket_id)
--    VALUES ('Usuários autenticados podem fazer upload', 
--           '(role() = ''authenticated''::text)', 
--           (SELECT id FROM storage.buckets WHERE name = 'profiles'));

-- 2. Permitir que qualquer pessoa veja as imagens:
--    INSERT INTO storage.policies (name, definition, bucket_id)
--    VALUES ('Acesso público para leitura', 
--           'true', 
--           (SELECT id FROM storage.buckets WHERE name = 'profiles'));
-- SQL para verificar as colunas existentes na tabela profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position;



-- SQL para adicionar a coluna 'full_name' à tabela 'profiles' no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'full_name'
    ) THEN
        -- 2. Adicionar a coluna 'full_name' se não existir
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        
        -- 3. Adicionar um comentário para documentação
        COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
    END IF;
END $$;

-- 4. Confirmar que a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'full_name';


-- SQL para adicionar a coluna 'address' à tabela 'profiles' no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'address'
    ) THEN
        -- 2. Adicionar a coluna 'address' se não existir
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
        
        -- 3. Adicionar um comentário para documentação
        COMMENT ON COLUMN public.profiles.address IS 'Endereço do usuário';
    END IF;
END $$;

-- 4. Confirmar que a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'address';


-- SQL para verificar e corrigir a estrutura da tabela profiles no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos verificar as colunas existentes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position;

-- 2. Adicionar as colunas necessárias se não existirem
DO $$
BEGIN
    -- Adicionar coluna full_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
    END IF;

    -- Adicionar coluna avatar_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da imagem de perfil do usuário';
    END IF;

    -- Adicionar coluna phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        COMMENT ON COLUMN public.profiles.phone IS 'Número de telefone do usuário';
    END IF;

    -- Adicionar coluna address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
        COMMENT ON COLUMN public.profiles.address IS 'Endereço do usuário';
    END IF;

    -- Adicionar coluna role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'public_user';
        COMMENT ON COLUMN public.profiles.role IS 'Função do usuário no sistema';
    END IF;

    -- Adicionar coluna updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        COMMENT ON COLUMN public.profiles.updated_at IS 'Data da última atualização';
    END IF;

    -- Adicionar coluna created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        COMMENT ON COLUMN public.profiles.created_at IS 'Data de criação';
    END IF;
END $$;

-- 3. Verificar novamente as colunas após as alterações
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position;
