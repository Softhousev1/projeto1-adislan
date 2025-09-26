const express = require("express");
const config = require("./config");

function createAdminRoutes(supabase) {
  const router = express.Router();

  // Rota Admin: listar usuários (via service key)
  router.get("/users", async (req, res) => {
    try {
      if (
        !config.supabase_service_key ||
        config.supabase_service_key === "supabase_placeholder"
      ) {
        return res.status(500).json({
          error: "SUPABASE_SERVICE_KEY não configurada no servidor",
        });
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, status")
        .order("full_name", { ascending: true });

      if (error) {
        return res.status(500).json({
          error: "Falha ao carregar usuários",
          details: error.message,
        });
      }
      return res.json({ users: data || [] });
    } catch (err) {
      console.error("Erro /admin/users [GET]:", err);
      return res.status(500).json({
        error: "Erro interno ao listar usuários",
        details: err.message,
      });
    }
  });

  // Rota Admin: criar usuário e perfil (requer SUPABASE_SERVICE_KEY no servidor)
  router.post("/users", async (req, res) => {
    try {
      if (
        !config.supabase_service_key ||
        config.supabase_service_key === "supabase_placeholder"
      ) {
        return res.status(500).json({
          error: "SUPABASE_SERVICE_KEY não configurada no servidor",
          details:
            "Defina a variável de ambiente SUPABASE_SERVICE_KEY ou ajuste config.js",
        });
      }
      const {
        full_name,
        email,
        password,
        role = "user",
        status = "active",
      } = req.body || {};
      if (!full_name || !email || !password) {
        return res
          .status(400)
          .json({ error: "full_name, email e password são obrigatórios" });
      }

      // 1) Criar usuário de autenticação
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
      if (authError) {
        return res.status(500).json({
          error: "Falha ao criar usuário de autenticação",
          details: authError.message,
        });
      }

      const userId = authData.user?.id;
      if (!userId) {
        return res
          .status(500)
          .json({ error: "Usuário criado sem ID retornado" });
      }

      // 2) Upsert no perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, full_name, email, role, status },
          { onConflict: "id" }
        );
      if (profileError) {
        return res.status(500).json({
          error: "Falha ao criar/atualizar perfil",
          details: profileError.message,
        });
      }

      return res
        .status(201)
        .json({ id: userId, full_name, email, role, status });
    } catch (err) {
      console.error("Erro /admin/users:", err);
      return res
        .status(500)
        .json({ error: "Erro interno ao criar usuário", details: err.message });
    }
  });

  // Rota Admin: excluir usuário (requer SUPABASE_SERVICE_KEY no servidor)
  router.delete("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "O ID do usuário é obrigatório" });
      }

      const { data, error } = await supabase.auth.admin.deleteUser(id);

      if (error) {
        return res
          .status(500)
          .json({ error: "Falha ao excluir usuário", details: error.message });
      }

      return res
        .status(200)
        .json({ message: "Usuário excluído com sucesso", user: data });
    } catch (err) {
      console.error(`Erro /admin/users/${req.params.id} [DELETE]:`, err);
      return res.status(500).json({
        error: "Erro interno ao excluir usuário",
        details: err.message,
      });
    }
  });

  // Rota Admin: editar usuário (requer SUPABASE_SERVICE_KEY no servidor)
  router.put("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, role, status, password } = req.body;

      if (!id) {
        return res.status(400).json({ error: "O ID do usuário é obrigatório" });
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name, role, status, updated_at: new Date() })
        .eq("id", id);

      if (profileError) {
        return res.status(500).json({
          error: "Falha ao atualizar o perfil do usuário",
          details: profileError.message,
        });
      }

      if (password) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          id,
          { password: password }
        );

        if (authError) {
          return res.status(200).json({
            message:
              "Perfil atualizado, mas falha ao alterar a senha do usuário.",
            details: authError.message,
          });
        }
      }

      return res.status(200).json({
        message: "Usuário atualizado com sucesso!",
        user: { id, full_name, role, status },
      });
    } catch (err) {
      console.error(`Erro /admin/users/${req.params.id} [PUT]:`, err);
      return res
        .status(500)
        .json({
          error: "Erro interno ao editar usuário",
          details: err.message,
        });
    }
  });

  return router;
}

module.exports = createAdminRoutes;
