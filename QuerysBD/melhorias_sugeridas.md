# Melhorias Sugeridas para a Página de Perfil

Após analisar a lógica de salvamento de dados no Supabase, identifiquei que o código está funcionando corretamente, mas há algumas melhorias que podem ser implementadas:

## 1. Upload de Imagem para o Supabase

Atualmente, a imagem de perfil é salva apenas no localStorage, o que significa que ela não persiste entre dispositivos ou navegadores. O código já possui uma seção comentada para fazer o upload da imagem para o Supabase Storage, mas está desativada.

### Sugestão:
Descomentar e ativar o código de upload de imagem para o Supabase Storage em ambientes de produção:

```javascript
// Remover a verificação de ambiente local ou modificar para:
if (!isLocalEnvironment()) {
  try {
    // Mostrar overlay e spinner durante o upload
    avatarOverlay.style.display = 'block';
    avatarSpinner.style.display = 'block';
    
    // Converter Base64 para Blob para upload
    const avatarBlob = base64ToBlob(profileData.avatarImage);
    const fileName = `${currentUserId}_${Date.now()}.png`;
    
    console.log('[perfil] Fazendo upload de imagem para bucket profiles, arquivo:', fileName);
    
    const { error: uploadError } = await supabaseClient
      .storage
      .from('profiles')
      .upload(fileName, avatarBlob, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Obter URL pública do avatar
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('profiles')
      .getPublicUrl(fileName);
    
    // Atualizar avatar_url no perfil
    await supabaseClient
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', currentUserId);
    
  } catch (error) {
    console.error('[perfil] Erro ao fazer upload da imagem:', error);
    showMessage("Erro ao salvar a imagem no servidor.", "warning");
  } finally {
    avatarOverlay.style.display = 'none';
    avatarSpinner.style.display = 'none';
  }
}
```

## 2. Melhorar o Tratamento de Erros

O código atual já possui um bom tratamento de erros, mas pode ser melhorado para fornecer mensagens mais específicas ao usuário.

### Sugestão:
```javascript
if (updateError) {
  console.error('[perfil] Erro ao atualizar perfil:', updateError);
  
  // Tratamento específico para diferentes tipos de erro
  switch(updateError.code) {
    case 'PGRST204':
      showMessage("Erro na estrutura da tabela. Contate o administrador.", "danger", 
                 "Detalhes: " + updateError.message);
      break;
    case '42501':
      showMessage("Você não tem permissão para atualizar este perfil.", "danger");
      break;
    case '42P01':
      showMessage("Tabela de perfis não encontrada. Contate o administrador.", "danger");
      break;
    default:
      showMessage("Erro ao salvar alterações no perfil.", "danger", 
                 "Código: " + updateError.code);
  }
  return;
}
```

## 3. Otimizar o Fluxo de Dados

Atualmente, os dados são salvos em vários lugares (localStorage, Supabase) com alguma duplicação. Podemos otimizar isso.

### Sugestão:
```javascript
// Após salvar com sucesso no Supabase
const savedData = {
  nome: nome,
  telefone: telefone || null,
  endereco: endereco || null,
  email: email,
  // Manter a imagem se existir
  avatarImage: profileData.avatarImage || null,
  // Adicionar dados do servidor
  id: currentUserId,
  lastUpdated: new Date().toISOString()
};

// Salvar em um único lugar no localStorage
localStorage.setItem('profileData', JSON.stringify(savedData));
localStorage.setItem('loggedInUser', JSON.stringify({
  ...savedData,
  isLoggedIn: true
}));

// Limpar dados temporários
localStorage.removeItem('profileFormData');
```

## 4. Verificação de Alterações

Atualmente, o código envia todas as informações para o servidor, mesmo que não tenham sido alteradas.

### Sugestão:
Implementar uma verificação para enviar apenas os campos que foram alterados:

```javascript
// Buscar dados atuais do perfil
const { data: currentProfile } = await supabaseClient
  .from('profiles')
  .select('*')
  .eq('id', currentUserId)
  .single();

// Preparar objeto apenas com campos alterados
const updates = { id: currentUserId };

if (!currentProfile || nome !== currentProfile.full_name) {
  updates.full_name = nome;
}

if (!currentProfile || telefone !== currentProfile.phone) {
  updates.phone = telefone || null;
}

if (!currentProfile || endereco !== currentProfile.address) {
  updates.address = endereco || null;
}

// Adicionar timestamp apenas se houver alterações
if (Object.keys(updates).length > 1) { // Mais que apenas o ID
  updates.updated_at = new Date();
  
  // Continuar com o upsert apenas se houver alterações
  const { error: updateError } = await supabaseClient
    .from('profiles')
    .upsert(updates, { returning: 'minimal' });
    
  // Tratamento de erro...
} else {
  console.log('[perfil] Nenhuma alteração detectada, não enviando para o servidor');
}
```

Estas melhorias tornarão o código mais robusto, eficiente e com melhor experiência para o usuário.
