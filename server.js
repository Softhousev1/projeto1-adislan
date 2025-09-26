const express = require("express");
const cors = require("cors");
const axios = require("axios");
const config = require("./config");
const { createClient } = require("@supabase/supabase-js");
const createAdminRoutes = require("./adminRoutes"); // Importa o criador de rotas de admin
const stripe = require("stripe")(config.stripe_secret_key); // Adiciona o Stripe

// Inicializar Express
const app = express();
const port = config.port;

// Configurações do Supabase (use variáveis de ambiente em produção)
const supabaseUrl = "https://hylttfhaedvytykjpeze.supabase.co";
const supabaseServiceKey = config.supabase_service_key; // Chave de serviço (segura)
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bHR0ZmhhZWR2eXR5a2pwZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTE1MDgsImV4cCI6MjA3NDI4NzUwOH0.e0BmMYbBC9QBI6TNsKgWUckFqCPnjPGEAq6-7h1W18A";
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: { Authorization: `Bearer ${supabaseServiceKey}` },
  },
});

// Configurar middleware
// CORS: permitir desenvolvimento local inclusive origem nula (file://)
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite qualquer origem em dev, incluindo null (file://)
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de autenticação e autorização para rotas de admin
const requireAdminAuth = async (req, res, next) => {
  try {
    // 1. Verificar se o cabeçalho de autorização existe
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Acesso negado. Nenhum token fornecido." });
    }

    // 2. Extrair o token
    const token = authHeader.split(" ")[1];

    // 3. Validar o token com o Supabase e obter o usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        error: "Token inválido ou expirado.",
        details: userError?.message,
      });
    }

    // 4. Verificar a permissão (role) do usuário na tabela 'profiles'
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res
        .status(403)
        .json({ error: "Perfil de usuário não encontrado." });
    }

    // 5. Checar se a role é 'admin' ou 'manager'
    if (!["admin", "manager"].includes(profile.role)) {
      return res.status(403).json({
        error: "Acesso negado. Requer permissão de administrador ou gerente.",
      });
    }

    // 6. Se tudo estiver OK, anexa o usuário à requisição e continua
    req.user = { ...user, role: profile.role }; // Anexa a role ao objeto do usuário
    next();
  } catch (err) {
    console.error("Erro no middleware de autenticação:", err);
    return res
      .status(500)
      .json({ error: "Erro interno no servidor durante a autenticação." });
  }
};

// Configura as rotas de admin
const adminRoutes = createAdminRoutes(supabase);
app.use("/admin", requireAdminAuth, adminRoutes);

// Rota para criar sessão de checkout do Stripe
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, payer, shipments, external_reference } = req.body;

    const total = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const shipping = shipments?.cost || 0;
    const finalTotal = total + shipping;

    // 1. Salvar o pedido no Supabase
    const { data: newOrder, error: supabaseError } = await supabase
      .from("orders") // Supondo que sua tabela se chame 'orders'
      .insert({
        customer_info: payer,
        items_info: items,
        shipping_info: shipments,
        total_amount: finalTotal,
        status: "pending",
        external_reference: external_reference,
      })
      .select()
      .single();

    if (supabaseError) {
      console.error("Erro ao salvar pedido no Supabase:", supabaseError);
      return res.status(500).json({
        error: "Erro ao registrar o pedido no banco de dados.",
        details: supabaseError.message,
      });
    }

    // 2. Formatar itens para o Stripe
    const line_items = items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.title || "Produto sem nome", // Fallback para evitar erro
          // images: [item.picture_url] // Opcional: adicione a URL da imagem aqui
        },
        unit_amount: Math.round(item.unit_price * 100), // Stripe usa centavos
      },
      quantity: item.quantity,
    }));

    // Adicionar frete como um item de linha, se houver
    if (shipping > 0) {
      line_items.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: "Frete",
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // 3. Criar a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "boleto"], // Revertido para apenas cartão e boleto
      line_items: line_items,
      mode: "payment",
      success_url: `${config.frontend_url}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontend_url}/payment.html?status=canceled`,
      customer_email: payer.email,
      metadata: {
        supabase_order_id: newOrder.id, // Salva o ID do nosso pedido no metadado do Stripe
        external_reference: external_reference,
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout do Stripe:", error);
    res.status(500).json({
      error: "Falha ao criar sessão de pagamento",
      details: error.message,
    });
  }
});

// Rota para verificar status do servidor
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "Servidor funcionando corretamente" });
});

// Rota para receber webhooks do Stripe
app.post("/webhook", (req, res) => {
  try {
    const event = req.body;
    console.log("Webhook do Stripe recebido:", event.type);

    // Lidar com o evento checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const supabaseOrderId = session.metadata.supabase_order_id;

      console.log(
        `Pagamento bem-sucedido para o pedido do Supabase: ${supabaseOrderId}`
      );

      // Aqui você deve atualizar o status do pedido no seu banco de dados (Supabase)
      // Exemplo:
      // await supabase
      //   .from('orders')
      //   .update({ status: 'paid', stripe_session_id: session.id })
      //   .eq('id', supabaseOrderId);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Erro ao processar webhook do PagSeguro:", error);
    res.status(500).send("Erro ao processar webhook");
  }
});

// Iniciar servidor
const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Erro: A porta ${port} já está em uso. Encerre o processo conflitante e tente novamente.`
    );
  } else {
    console.error("Ocorreu um erro ao iniciar o servidor:", err);
  }
});
