// Estado da aplicação, agora persistido no localStorage
let state = {
  products: [],
  finances: [],
  users: [], // Adiciona estado para usuários
  orders: [],
  currentUser: { role: null, avatar_url: null }, // Armazena o perfil do usuário logado
};

// Carrega o estado do localStorage ao iniciar
function loadState() {
  const savedState = localStorage.getItem("adminState");
  if (savedState) {
    // Apenas as finanças são carregadas do localStorage agora
    state.finances = JSON.parse(savedState).finances || [];
  }
}

// Salva o estado no localStorage
function saveState() {
  // Apenas as finanças são salvas no localStorage agora
  localStorage.setItem(
    "adminState",
    JSON.stringify({ finances: state.finances })
  );
}

// Navegação
function navigate(e) {
  e.preventDefault(); // Impede o comportamento padrão do link de recarregar a página
  const el = e.currentTarget;
  const navItem = el.closest(".nav-item"); // Encontra o elemento <li> pai
  if (!navItem) return;

  const page = navItem.getAttribute("data-page");

  // Remove a classe 'active' de todos os links e adiciona no clicado
  document
    .querySelectorAll(".sidebar .nav-link")
    .forEach((n) => n.classList.remove("active"));
  el.classList.add("active");

  showPage(page);
}

function showPage(page) {
  // REGRA DE ACESSO: Apenas 'admin' pode ver a página 'financeiro'
  if (page === "financeiro" && state.currentUser.role !== "admin") {
    console.warn(
      `Acesso negado à página 'financeiro' para o usuário com role '${state.currentUser.role}'.`
    );
    alert("Você não tem permissão para acessar esta página.");
    showPage("panel"); // Redireciona para o painel principal
    return;
  }

  // REGRA DE ACESSO: Apenas 'admin' e 'manager' podem ver 'usuarios'
  if (page === "usuarios" && !["admin"].includes(state.currentUser.role)) {
    alert("Você não tem permissão para acessar esta página.");
    showPage("panel"); // Redireciona para o painel principal
    return;
  }

  document.getElementById("pageTitle").innerText =
    page.charAt(0).toUpperCase() + page.slice(1);
  document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));
  const el = document.getElementById(page);
  if (el) el.style.display = "block";

  // Garante que o item de menu correto esteja ativo
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    const navItem = link.closest(".nav-item");
    link.classList.toggle(
      "active",
      navItem && navItem.getAttribute("data-page") === page
    );
  });
  refreshUI();
}

function showReport() {
  showToast("Funcionalidade de Relatórios em desenvolvimento.", "info");
}

// --- Sistema de Notificação (Toast) ---
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  const typeMap = {
    success: { bg: "bg-success", icon: "fa-check-circle" },
    error: { bg: "bg-danger", icon: "fa-exclamation-circle" },
    warning: { bg: "bg-warning", icon: "fa-exclamation-triangle" },
    info: { bg: "bg-info", icon: "fa-info-circle" },
  };
  const config = typeMap[type] || typeMap.info;

  toast.className = `toast align-items-center text-white ${config.bg} border-0`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"><i class="fas ${config.icon} me-2"></i>${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  container.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
  bsToast.show();
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// --- Sistema de Confirmação (Modal) ---
function showConfirmationModal(message, onConfirm) {
  const modalElement = document.getElementById("confirmationModal");
  const modalBody = document.getElementById("confirmationModalBody");
  const confirmButton = document.getElementById("confirmActionButton");

  modalBody.textContent = message;

  const modal = new bootstrap.Modal(modalElement);

  // Função para lidar com o clique de confirmação.
  // Usamos um handler que se remove para evitar múltiplos cliques/eventos.
  const confirmHandler = async () => {
    // Adiciona estado de carregamento ao botão para melhor UX
    const originalButtonText = confirmButton.innerHTML;
    confirmButton.disabled = true;
    confirmButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...`;

    try {
      await onConfirm(); // Espera a função assíncrona (ex: deleteUser) terminar
    } finally {
      // Restaura o botão e esconde o modal APÓS a operação, resolvendo o aviso de acessibilidade
      confirmButton.disabled = false;
      confirmButton.innerHTML = originalButtonText;
      modal.hide();
    }
  };

  // A forma mais segura de lidar com listeners em modais reutilizáveis é remover o antigo e adicionar o novo.
  // Clonar o nó é uma maneira eficaz de remover todos os listeners existentes.
  const newConfirmButton = confirmButton.cloneNode(true); // Cria uma cópia limpa do botão
  confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton); // Substitui o botão antigo pelo novo

  // Adiciona o listener ao novo botão. A opção { once: true } é uma ótima prática aqui.
  newConfirmButton.addEventListener("click", confirmHandler, { once: true });

  modal.show();
}

// Produtos
function openAddProduct() {
  // Limpa o formulário e os atributos de edição
  const form = document.getElementById("prodForm");
  form.reset();
  form.removeAttribute("data-editing-id");
  form.removeAttribute("data-editing-image");

  // Restaura o título e o botão para o modo de adição
  document.getElementById("productModalTitle").textContent =
    "Adicionar Novo Produto";
  document.getElementById("productSubmitButton").textContent =
    "Adicionar Produto";

  const productModal = new bootstrap.Modal(
    document.getElementById("productModal")
  );
  productModal.show();
  document.getElementById("pNome").focus();
}
function closeAddProduct() {
  const productModalEl = document.getElementById("productModal");
  const productModal = bootstrap.Modal.getInstance(productModalEl);
  if (productModal) productModal.hide();
}

async function saveProduct(e) {
  e.preventDefault();

  const form = document.getElementById("prodForm");
  const editingId = form.getAttribute("data-editing-id");

  // Desabilita o botão para evitar cliques duplos
  const submitButton = document.getElementById("productSubmitButton");
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Salvando...";

  const nome = document.getElementById("pNome").value.trim();
  const cat_id = document.getElementById("pCategoria").value;
  const preco = parseFloat(document.getElementById("pPreco").value || 0);
  const estoque = parseInt(document.getElementById("pEstoque").value || 0, 10);
  const desc = document.getElementById("pDescricao").value.trim();
  const imagemFile = document.getElementById("pImagem").files[0];

  let imageUrl = form.getAttribute("data-editing-image") || null;

  if (!nome || !preco || !cat_id) {
    showToast(
      "Por favor, preencha nome, categoria e preço do produto.",
      "warning"
    );
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
    return;
  }

  if (imagemFile) {
    // Se uma nova imagem for enviada durante a edição, remove a antiga primeiro.
    const oldImageUrl = form.getAttribute("data-editing-image");
    if (editingId && oldImageUrl) {
      const oldImageName = oldImageUrl.split("/").pop();
      await supabase.storage.from("product_images").remove([oldImageName]);
    }

    const fileName = `${Date.now()}_${imagemFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product_images")
      .upload(fileName, imagemFile);

    if (uploadError) {
      console.error("Erro no upload da imagem:", uploadError);
      showToast("Falha ao enviar a imagem.", "error");
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    imageUrl = supabase.storage
      .from("product_images")
      .getPublicUrl(uploadData.path).data.publicUrl;
  }

  const productData = {
    name: nome,
    category_id: cat_id,
    price: preco,
    stock: estoque,
    description: desc,
    image_url: imageUrl,
  };

  let error;
  if (editingId) {
    // Modo Edição: faz o UPDATE
    const { error: updateError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", editingId);
    error = updateError;
  } else {
    // Modo Adição: faz o INSERT
    const { error: insertError } = await supabase
      .from("products")
      .insert([productData]);
    error = insertError;
  }

  if (error) {
    console.error("Erro ao salvar produto:", error);
    showToast("Falha ao salvar o produto. Verifique o console.", "error");
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
    return false;
  }

  closeAddProduct();
  fetchAndRenderProducts();

  submitButton.disabled = false;
  submitButton.textContent = originalButtonText;

  return false;
}

function openEditProduct(product) {
  // Adiciona um ID ao formulário para sabermos que estamos editando
  document
    .getElementById("prodForm")
    .setAttribute("data-editing-id", product.id);
  document
    .getElementById("prodForm")
    .setAttribute("data-editing-image", product.image_url || "");

  // Popula os campos do modal
  document.getElementById("pNome").value = product.name;
  document.getElementById("pCategoria").value = product.category_id;
  document.getElementById("pPreco").value = product.price;
  document.getElementById("pEstoque").value = product.stock;
  document.getElementById("pDescricao").value = product.description || "";

  // Altera o título e o botão
  document.getElementById("productModalTitle").textContent = "Editar Produto";
  document.getElementById("productSubmitButton").textContent =
    "Salvar Alterações";

  // Limpa o campo de imagem e abre o modal
  document.getElementById("pImagem").value = "";
  const productModal = new bootstrap.Modal(
    document.getElementById("productModal")
  );
  productModal.show();
}

async function deleteProduct(id, imageUrl, productName) {
  const confirmationMessage = `Tem certeza que deseja excluir o produto "${escapeHtml(
    productName
  )}"? Esta ação não pode ser desfeita.`;

  showConfirmationModal(confirmationMessage, async () => {
    // Excluir do banco de dados
    const { error: dbError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Erro ao excluir produto:", dbError);
      showToast("Não foi possível excluir o produto.", "error");
      return;
    }

    // Excluir imagem do storage, se houver
    if (imageUrl) {
      const imageName = imageUrl.split("/").pop();
      const { error: storageError } = await supabase.storage
        .from("product_images")
        .remove([imageName]);

      if (storageError) {
        console.error("Erro ao excluir imagem do storage:", storageError);
        showToast(
          "Produto excluído, mas houve um erro ao remover a imagem.",
          "warning"
        );
      }
    }

    showToast("Produto excluído com sucesso!", "success");
    fetchAndRenderProducts();
  });
}

// --- SEÇÃO DE USUÁRIOS ---

function openAddUserModal() {
  const form = document.getElementById("userForm");
  form.reset();
  form.removeAttribute("data-editing-id");

  // Corrige o seletor para o título do modal
  document.getElementById("userModalLabel").textContent =
    "Adicionar Novo Usuário";
  document.getElementById("userSubmitButton").textContent = "Adicionar Usuário";

  // Habilita o campo de email e torna a senha obrigatória para adição
  document.getElementById("uEmail").disabled = false;
  document.getElementById("uSenha").required = true;
  document.getElementById("uSenha").placeholder = "Mínimo 6 caracteres";

  const userModal = new bootstrap.Modal(document.getElementById("userModal"));
  userModal.show();
  document.getElementById("uNome").focus();
}

function closeUserModal() {
  const userModalEl = document.getElementById("userModal");
  const userModal = bootstrap.Modal.getInstance(userModalEl);
  if (userModal) userModal.hide();
}

function openEditUserModal(user) {
  const form = document.getElementById("userForm");
  form.setAttribute("data-editing-id", user.id);

  document.getElementById("uNome").value = user.full_name || "";
  document.getElementById("uEmail").value = user.email || "";
  document.getElementById("uPermissao").value = user.role || "user";
  document.getElementById("uStatus").value = user.status || "active";

  // Limpa e torna a senha opcional na edição
  document.getElementById("uSenha").value = "";
  document.getElementById("uSenha").required = false;
  document.getElementById("uSenha").placeholder =
    "Deixe em branco para não alterar";

  // Desabilita a edição do email (chave primária de autenticação)
  document.getElementById("uEmail").disabled = true;

  // Corrige o seletor para o título do modal
  document.getElementById("userModalLabel").textContent = "Editar Usuário";
  document.getElementById("userSubmitButton").textContent = "Salvar Alterações";

  const userModal = new bootstrap.Modal(document.getElementById("userModal"));
  userModal.show();
}

async function saveUser(e) {
  e.preventDefault();
  const form = document.getElementById("userForm");
  const editingId = form.getAttribute("data-editing-id");

  const submitButton = document.getElementById("userSubmitButton");
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Salvando...";

  const fullName = document.getElementById("uNome").value.trim();
  const email = document.getElementById("uEmail").value.trim();
  const password = document.getElementById("uSenha").value;
  const role = document.getElementById("uPermissao").value;
  const status = document.getElementById("uStatus").value;

  try {
    console.log(
      "[saveUser] Iniciando salvamento. Modo:",
      editingId ? "Edição" : "Criação"
    );

    // Força a atualização da sessão para garantir que o token de acesso esteja válido.
    // Isso ajuda a evitar erros de "sessão inválida" se o token tiver expirado.
    console.log("[saveUser] 1. Tentando atualizar a sessão...");
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    if (refreshError) {
      console.error("[saveUser] ERRO ao atualizar a sessão:", refreshError);
      throw new Error(
        "Não foi possível validar a sessão. Faça login novamente."
      );
    }
    console.log("[saveUser] 2. Sessão atualizada com sucesso.");

    const session = refreshData.session;
    console.log(
      "[saveUser] 3. Obtendo sessão atual. A sessão é:",
      session ? "Válida" : "Nula",
      session // Loga o objeto da sessão inteiro para inspeção
    );

    // Adiciona uma verificação explícita para garantir que a sessão e o token existam.
    // O 'optional chaining' (?.) previne erros se a sessão for nula.
    if (!session?.access_token) {
      console.error(
        "[saveUser] ERRO: O 'access_token' não foi encontrado na sessão."
      );
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    console.log(
      "[saveUser] 4. Token de acesso encontrado. Preparando requisição..."
    );

    const backendUrl =
      localStorage.getItem("backendUrl") || "http://localhost:3000";
    let url = `${backendUrl}/admin/users`;
    let method = "POST";

    const body = {
      full_name: fullName,
      email: email,
      role: role,
      status: status,
    };

    if (editingId) {
      // --- MODO EDIÇÃO ---
      url = `${backendUrl}/admin/users/${editingId}`;
      method = "PUT";
      // No modo de edição, não enviamos o email e só enviamos a senha se ela for preenchida
      delete body.email;
      if (password) {
        body.password = password;
      }
    } else {
      // --- MODO CRIAÇÃO ---
      if (password.length < 6) {
        throw new Error("A senha deve ter no mínimo 6 caracteres.");
      }
      body.password = password;
    }

    console.log(
      `[saveUser] 5. Enviando requisição ${method} para ${url} com o corpo:`,
      body
    );

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`, // Correção: access_token
      },
      body: JSON.stringify(body),
    });

    console.log(
      "[saveUser] 6. Resposta do servidor recebida. Status:",
      response.status
    );
    const result = await response.json();

    if (!response.ok) {
      console.error(
        "[saveUser] ERRO: A resposta do servidor não foi OK.",
        result
      );
      throw new Error(
        result.details || result.error || "Erro desconhecido do servidor."
      );
    }
    console.log("[saveUser] 7. Operação bem-sucedida. Resposta:", result);
    showToast(result.message || "Operação realizada com sucesso!", "success");

    closeUserModal();
    fetchAndRenderUsers(); // Atualiza a lista de usuários
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    showToast(`Falha ao salvar usuário: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
  return false;
}

async function deleteUser(userId, userName) {
  const confirmationMessage = `Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário "${userName}"? Esta ação não pode ser desfeita.`;

  showConfirmationModal(confirmationMessage, async () => {
    // A função passada para onConfirm já é async
    // O código abaixo só será executado se o usuário clicar em "Confirmar" no modal.

    // Verifica se o usuário logado está tentando se auto-excluir
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session && session.user.id === userId) {
      showToast("Você não pode excluir sua própria conta.", "warning");
      return;
    }

    // Corrigido: a propriedade é 'access_token' e a verificação já existe no refreshSession
    if (!session?.access_token) {
      showToast("Sessão inválida ou expirada. Faça login novamente.", "error");
      return;
    }

    // Chama o endpoint seguro no backend
    try {
      const backendUrl =
        localStorage.getItem("backendUrl") || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`, // Correção: access_token
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Erro desconhecido do servidor."
        );
      }

      showToast(result.message || "Usuário excluído com sucesso!", "success");
      fetchAndRenderUsers(); // Atualiza a lista de usuários na tela
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      showToast(
        `Não foi possível excluir o usuário: ${error.message}`,
        "error"
      );
    }
  });
}

// Financeiro
function toggleFinForm() {
  const f = document.getElementById("finForm");
  f.style.display =
    f.style.display === "none" || f.style.display === "" ? "block" : "none";
}
function addFinance(e) {
  e.preventDefault();
  const tipo = document.getElementById("fTipo").value;
  const valor = parseFloat(document.getElementById("fValor").value || 0);
  const cat = document.getElementById("fCategoria").value.trim();
  const desc = document.getElementById("fDescricao").value.trim();
  const id = Date.now();
  state.finances.unshift({
    id,
    tipo,
    valor,
    cat,
    desc,
    date: new Date().toISOString(),
  });
  saveState(); // Salva o estado
  document.getElementById("fValor").value = "";
  document.getElementById("fCategoria").value = "";
  document.getElementById("fDescricao").value = "";
  toggleFinForm();
  refreshUI();
  showPage("financeiro");
  return false;
}

// Atualização da UI
function refreshUI() {
  // REGRA DE ACESSO: Esconde o menu 'Financeiro' se o usuário não for admin
  const financeiroNav = document.querySelector(
    '.nav-item[data-page="financeiro"]'
  );
  if (financeiroNav) {
    financeiroNav.style.display =
      state.currentUser.role === "admin" ? "flex" : "none";
  }

  // REGRA DE ACESSO: Esconde o menu 'Usuários' se o usuário for 'seller'
  const usuariosNav = document.querySelector('.nav-item[data-page="usuarios"]');
  if (usuariosNav) {
    usuariosNav.style.display = ["admin", "manager"].includes(
      state.currentUser.role
    )
      ? "flex"
      : "none";
  }

  // Atualiza o avatar do usuário no cabeçalho
  const userAvatar = document.getElementById("user-avatar");
  if (userAvatar) {
    // Usa a URL do avatar do estado, ou uma imagem padrão se não houver
    userAvatar.src = state.currentUser.avatar_url || "https://i.pravatar.cc/40";
  }

  // summary cards
  document.getElementById("totalProdutos").innerText = state.products.length;
  const receita = state.finances
    .filter((f) => f.tipo === "receita")
    .reduce((s, i) => s + i.valor, 0);
  const despesas = state.finances
    .filter((f) => f.tipo === "despesa")
    .reduce((s, i) => s + i.valor, 0);
  document.getElementById("totalReceita").innerText = formatMoney(receita);
  document.getElementById("totalDespesas").innerText = formatMoney(despesas);
  document.getElementById("rReceita").innerText = formatMoney(receita);
  document.getElementById("rDespesas").innerText = formatMoney(despesas);
  document.getElementById("rLucro").innerText = formatMoney(receita - despesas);

  // Tabela de produtos
  const prodBody = document.getElementById("prodBody");
  const stockBody = document.getElementById("stockBody");
  prodBody.innerHTML = "";
  stockBody.innerHTML = "";

  if (state.products.length === 0) {
    document.getElementById("prodEmpty").style.display = "flex";
    document.getElementById("prodTable").style.display = "none";
    document.getElementById("stockEmpty").style.display = "flex";
  } else {
    document.getElementById("prodEmpty").style.display = "none";
    document.getElementById("prodTable").style.display = "table";
    document.getElementById("stockEmpty").style.display = "none";
  }

  state.products.forEach((prod) => {
    const status =
      prod.stock === 0
        ? "Sem estoque"
        : prod.stock <= 3
        ? "Estoque baixo"
        : "Em estoque";
    const tr = document.createElement("tr");
    // A consulta agora traz o nome da categoria de 'categories.name'
    const categoryName = prod.categories
      ? prod.categories.name
      : "Sem Categoria";
    const imageUrl = prod.image_url
      ? `<img src="${prod.image_url}" alt="${escapeHtml(
          prod.name
        )}" width="40" height="40" style="object-fit: cover; border-radius: 4px;">`
      : "Sem Imagem";

    tr.innerHTML = `
        <td>${imageUrl}</td>
        <td>${escapeHtml(prod.name)}</td>
        <td>${escapeHtml(categoryName)}</td>
        <td>R$ ${Number(prod.price).toFixed(2)}</td>
        <td>${prod.stock}</td>
        <td>${status}</td>
        <td>
            <button class="btn btn-sm btn-secondary" onclick='openEditProduct(${JSON.stringify(
              prod
            )})'>Editar</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
              prod.id
            }, '${prod.image_url}', '${escapeHtml(
      prod.name
    )}')">Excluir</button>
        </td>
      `;
    prodBody.appendChild(tr);

    const tr2 = tr.cloneNode(true);
    stockBody.appendChild(tr2);
  });

  // Financeiro
  const finBody = document.getElementById("finBody");
  finBody.innerHTML = "";
  if (state.finances.length === 0) {
    document.getElementById("finEmpty").style.display = "flex";
  } else {
    document.getElementById("finEmpty").style.display = "none";
  }
  state.finances.forEach((fn) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${
      fn.tipo === "receita" ? "Receita" : "Despesa"
    }</td><td>R$ ${fn.valor.toFixed(2)}</td><td>${escapeHtml(
      fn.cat
    )}</td><td>${escapeHtml(fn.desc)}</td>`;
    finBody.appendChild(tr);
  });

  // Contagem de estoque
  const em = state.products.filter((p) => p.stock > 3).length;
  const baixo = state.products.filter(
    (p) => p.stock > 0 && p.stock <= 3
  ).length;
  const zero = state.products.filter((p) => p.stock === 0).length;
  document.getElementById("estoqueEm").innerText = em;
  document.getElementById("estoqueBaixo").innerText = baixo;
  document.getElementById("estoqueZero").innerText = zero;
  document.getElementById("itensFalta").innerText = baixo + zero;
}

async function fetchAndRenderProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
            *,
            categories ( name )
        `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos:", error);
    showToast("Não foi possível carregar os produtos.", "error");
    return;
  }

  state.products = data;
  refreshUI();
}

async function fetchAndRenderUsers() {
  // Adiciona uma verificação de permissão no frontend.
  // Só tenta buscar os usuários se o usuário logado for um administrador.
  if (state.currentUser.role !== "admin") {
    console.log("[fetchAndRenderUsers] Acesso pulado. Usuário não é admin.");
    return;
  }

  // Melhoria: Utiliza o endpoint seguro do backend para buscar usuários.
  try {
    await supabase.auth.refreshSession();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Sessão inválida para buscar usuários.");
    }

    const backendUrl =
      localStorage.getItem("backendUrl") || "http://localhost:3000";
    const response = await fetch(`${backendUrl}/admin/users`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`, // Correção: access_token
      },
    });

    if (!response.ok)
      throw new Error(`Erro do servidor: ${response.statusText}`);

    const data = await response.json();
    state.users = data.users || [];
    renderUsersList();
  } catch (error) {
    console.error("Erro ao buscar usuários via backend:", error);
    showToast(
      `Não foi possível carregar os usuários: ${error.message}`,
      "error"
    );
  }
}

function renderUsersList() {
  const userBody = document.getElementById("userBody");
  const userEmpty = document.getElementById("userEmpty");
  const userRoleFilterEl = document.getElementById("userRoleFilter");
  if (!userBody || !userEmpty || !userRoleFilterEl) return;

  const userRoleFilter = userRoleFilterEl.value;
  userBody.innerHTML = "";

  // Filtra os usuários com base no cargo selecionado
  const filteredUsers = state.users.filter((user) => {
    if (userRoleFilter === "all") {
      return true; // Mostra todos se 'all' estiver selecionado
    }
    return user.role === userRoleFilter;
  });

  if (filteredUsers.length === 0) {
    userEmpty.style.display = "block"; // Usa 'block' para o novo layout
    document.getElementById("userTable").style.display = "none";
  } else {
    userEmpty.style.display = "none";
    document.getElementById("userTable").style.display = "table";
  }

  filteredUsers.forEach((user) => {
    const tr = document.createElement("tr");
    const statusClass =
      user.status === "active" ? "status-active" : "status-inactive";
    tr.innerHTML = `
            <td>${escapeHtml(user.full_name || "N/A")}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td><span class="status ${statusClass}">${
      user.status || "N/A"
    }</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-secondary" onclick='openEditUserModal(${JSON.stringify(
                  user
                )})'>Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${
                  user.id
                }', '${escapeHtml(user.full_name || user.email)}')">
                  Excluir
                </button>
            </td>
        `;
    userBody.appendChild(tr);
  });
}

async function renderCategoriesTable() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Erro ao buscar categorias para a tabela:", error);
    return;
  }

  const catBody = document.getElementById("catBody");
  const catEmpty = document.getElementById("catEmpty");
  catBody.innerHTML = "";

  if (data.length === 0) {
    catEmpty.style.display = "flex";
    document.getElementById("catTable").style.display = "none";
  } else {
    catEmpty.style.display = "none";
    document.getElementById("catTable").style.display = "table";
    data.forEach((cat) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${escapeHtml(cat.name)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editCategory(${
                      cat.id
                    }, '${escapeHtml(cat.name)}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${
                      cat.id
                    })">Excluir</button>
                </td>
            `;
      catBody.appendChild(tr);
    });
  }
}

async function fetchAndPopulateCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return;
  }

  const select = document.getElementById("pCategoria");
  select.innerHTML = '<option value="">Selecione uma categoria</option>'; // Opção padrão
  data.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

async function addNewCategory() {
  const categoryName = prompt("Digite o nome da nova categoria:");
  if (!categoryName || categoryName.trim() === "") {
    return; // Usuário cancelou ou não digitou nada
  }

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name: categoryName.trim() }])
    .select();

  if (error) {
    console.error("Erro ao adicionar categoria:", error);
    showToast(
      "Não foi possível adicionar a categoria. Verifique se ela já existe.",
      "error"
    );
    return;
  }

  showToast("Categoria adicionada com sucesso!", "success");
  fetchAndPopulateCategories(); // Atualiza o dropdown
  renderCategoriesTable(); // Atualiza a tabela de categorias
}

async function editCategory(id, currentName) {
  const newName = prompt("Digite o novo nome para a categoria:", currentName);
  if (!newName || newName.trim() === "" || newName.trim() === currentName) {
    return; // Usuário cancelou ou não alterou o nome
  }

  const { error } = await supabase
    .from("categories")
    .update({ name: newName.trim() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao editar categoria:", error);
    showToast("Não foi possível editar a categoria.", "error");
    return;
  }

  showToast("Categoria atualizada com sucesso!", "success");
  fetchAndPopulateCategories();
  renderCategoriesTable();
}

async function deleteCategory(id) {
  if (
    !confirm(
      "Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
    )
  ) {
    return;
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir categoria:", error);
    showToast(
      "Não foi possível excluir a categoria. Verifique se ela não está sendo usada por nenhum produto.",
      "error"
    );
    return;
  }

  showToast("Categoria excluída com sucesso!", "success");
  fetchAndPopulateCategories();
  renderCategoriesTable();
}

// --- SEÇÃO DE PEDIDOS ---

let orderFilter = "all"; // all | pending | shipped | etc.
let ordersView = "cards"; // 'cards' ou 'table'

async function fetchAndRenderOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar pedidos:", error);
    showToast("Não foi possível carregar os pedidos.", "error");
    state.orders = [];
  } else {
    state.orders = data || [];
  }
  renderOrdersList();
}

function setOrderFilter(filter) {
  orderFilter = filter;
  document
    .querySelectorAll(".btn-filter")
    .forEach((b) => b.classList.remove("active"));
  document
    .getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)
    .classList.add("active");
  renderOrdersList();
}

function toggleOrdersView() {
  ordersView = ordersView === "cards" ? "table" : "cards";
  document.getElementById("toggleViewBtn").innerText =
    ordersView === "cards" ? "Ver em Tabela" : "Ver em Cards";
  renderOrdersList();
}

function statusBadge(status) {
  const statusMap = {
    pending: { text: "Pendente", class: "badge-pending" },
    waiting_payment: { text: "Aguardando Pagamento", class: "badge-pending" },
    paid: { text: "Pago", class: "badge-paid" },
    shipped: { text: "Enviado", class: "badge-shipped" },
    delivered: { text: "Entregue", class: "badge-finalized" },
    finalized: { text: "Finalizado", class: "badge-finalized" },
    canceled: { text: "Cancelado", class: "badge-canceled" },
  };
  const info = statusMap[status] || { text: status, class: "badge-default" };
  return `<span class="badge-order ${info.class}">${escapeHtml(
    String(info.text || status || "")
  )}</span>`;
}

function renderOrdersList() {
  const container = document.getElementById("ordersList");
  const emptyEl = document.getElementById("ordersEmpty");
  if (!container || !emptyEl) return;

  // Adiciona uma verificação para o campo de busca, que pode não estar sempre visível
  const searchInput = document.getElementById("ordersSearch");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  let filteredOrders = state.orders;

  if (orderFilter !== "all") {
    filteredOrders = filteredOrders.filter((o) => o.status === orderFilter);
  }

  if (searchTerm) {
    filteredOrders = filteredOrders.filter(
      (o) =>
        o.id.toString().includes(searchTerm) ||
        (o.customer_info?.name || "").toLowerCase().includes(searchTerm) ||
        (o.customer_info?.email || "").toLowerCase().includes(searchTerm)
    );
  }

  if (filteredOrders.length === 0) {
    container.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }

  emptyEl.style.display = "none";

  if (ordersView === "cards") {
    container.innerHTML = `<div class="orders-grid">${filteredOrders
      .map(
        (order) => `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <strong>Pedido #${order.id}</strong>
                    ${statusBadge(order.status)}
                </div>
                <div class="order-card-body">
                    <p><strong>Cliente:</strong> ${escapeHtml(
                      (order.customer_info && order.customer_info.name) || "N/A"
                    )}</p>
                    <p><strong>Total:</strong> ${formatMoney(
                      order.total_amount
                    )}</p>
                    <p><strong>Data:</strong> ${new Date(
                      order.created_at
                    ).toLocaleDateString()}</p>
                </div>
                <div class="order-card-footer">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openOrderStatusModal(${
                      order.id
                    })">Alterar Status</button>
                </div>
            </div>
        `
      )
      .join("")}</div>`;
  } else {
    // Table view
    container.innerHTML = `
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredOrders
                      .map(
                        (order) => `
                        <tr data-order-id="${order.id}">
                            <td>#${order.id}</td>
                            <td>${escapeHtml(
                              (order.customer_info &&
                                order.customer_info.name) ||
                                "N/A"
                            )}</td>
                            <td>${new Date(
                              order.created_at
                            ).toLocaleDateString()}</td>
                            <td>${formatMoney(order.total_amount)}</td>
                            <td>${statusBadge(order.status)}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openOrderStatusModal(${
                                  order.id
                                })">Alterar</button>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  }
}

function openOrderStatusModal(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;

  document.getElementById("statusOrderId").textContent = `#${orderId}`;
  const statusSelect = document.getElementById("modalStatusSelect");
  statusSelect.value = order.status;
  statusSelect.setAttribute("data-order-id", orderId);

  const orderStatusModal = new bootstrap.Modal(
    document.getElementById("orderStatusModal")
  );
  orderStatusModal.show();
}

function closeOrderStatusModal() {
  const orderStatusModalEl = document.getElementById("orderStatusModal");
  const orderStatusModal = bootstrap.Modal.getInstance(orderStatusModalEl);
  if (orderStatusModal) orderStatusModal.hide();
}

async function confirmOrderStatusChange() {
  const statusSelect = document.getElementById("modalStatusSelect");
  const orderId = statusSelect.getAttribute("data-order-id");
  const newStatus = statusSelect.value;

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    console.error("Erro ao atualizar status:", error);
    showToast("Falha ao atualizar o status do pedido.", "error");
  } else {
    // Atualiza o estado local e renderiza novamente
    const orderInState = state.orders.find((o) => o.id == orderId);
    if (orderInState) {
      orderInState.status = newStatus;
    }
    renderOrdersList();
    showToast("Status do pedido atualizado com sucesso!", "success");
  }

  closeOrderStatusModal();
}

function showOrderDetails(event) {
  // Encontra o elemento clicável mais próximo (card ou linha da tabela)
  const target = event.target.closest("[data-order-id]");
  if (!target) return;

  // Pega o ID do pedido a partir do data-attribute
  const orderId = parseInt(target.dataset.orderId, 10);
  if (!orderId) return;

  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;

  const detailBody = document.getElementById("orderDetailBody");
  document.getElementById("detailOrderId").textContent = `#${order.id}`;

  const itemsHtml = (order.items_info || [])
    .map(
      (item) => `
        <li>${escapeHtml(item.title || "Item sem nome")} (x${
        item.quantity
      }) - ${formatMoney(item.unit_price)}</li>
    `
    )
    .join("");

  detailBody.innerHTML = `
        <p><strong>Status:</strong> ${statusBadge(order.status)}</p>
        <p><strong>Data do Pedido:</strong> ${new Date(
          order.created_at
        ).toLocaleString()}</p>
        <hr>
        <h4>Informações do Cliente</h4>
        <p><strong>Nome:</strong> ${escapeHtml(
          (order.customer_info && order.customer_info.name) || "N/A"
        )}</p>
        <p><strong>Email:</strong> ${escapeHtml(
          (order.customer_info && order.customer_info.email) || "N/A"
        )}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(
          (order.customer_info?.phone?.number || "N/A").toString()
        )}</p>
        <hr>
        <h4>Itens do Pedido</h4>
        <ul>${itemsHtml || "<li>Nenhum item encontrado.</li>"}</ul>
        <hr>
        <h4>Total do Pedido: ${formatMoney(order.total_amount)}</h4>
    `;

  const orderDetailModal = new bootstrap.Modal(
    document.getElementById("orderDetailModal")
  );
  orderDetailModal.show();
}

function closeOrderDetails() {
  const orderDetailModalEl = document.getElementById("orderDetailModal");
  const orderDetailModal = bootstrap.Modal.getInstance(orderDetailModalEl);
  if (orderDetailModal) orderDetailModal.hide();
}

async function fetchCurrentUserRole() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Sessão não encontrada, redirecionando para login.");
    window.location.href = "../login.html";
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, avatar_url")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Não foi possível buscar o perfil do usuário.", profileError);
    await supabase.auth.signOut();
    window.location.href = "../login.html";
    return;
  }

  state.currentUser.role = profile.role;
  state.currentUser.avatar_url = profile.avatar_url;
}

async function init() {
  loadState(); // Carrega o estado salvo (apenas finanças)
  await fetchCurrentUserRole(); // Busca a permissão do usuário logado
  refreshUI();
  showPage("panel");
  fetchAndRenderProducts(); // Busca e renderiza os produtos do Supabase
  fetchAndPopulateCategories(); // Busca e preenche as categorias no modal
  await fetchAndRenderUsers(); // Busca e renderiza os usuários (agora com await)
  renderCategoriesTable(); // Busca e renderiza a tabela de categorias
  fetchAndRenderOrders(); // Busca e renderiza os pedidos
  document
    .getElementById("btnNovaCategoria")
    .addEventListener("click", addNewCategory);

  // Adiciona o event listener centralizado para os detalhes do pedido
  const ordersListContainer = document.getElementById("ordersList");
  if (ordersListContainer)
    ordersListContainer.addEventListener("click", showOrderDetails);
}

// Helpers
function formatMoney(v) {
  return "R$" + Number(v).toFixed(2);
}
function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Inicializa a aplicação
init();

// Função de logout
document.getElementById("btnLogout").onclick = async function () {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Erro ao fazer logout:", error);
    return;
  }
  // Limpa qualquer estado antigo, se necessário
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("adminState");
  window.location.href = "../login.html";
};
