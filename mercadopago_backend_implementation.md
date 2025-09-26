# Implementação do Backend para Integração com Mercado Pago

Este documento descreve como implementar o backend necessário para integrar o Mercado Pago ao sistema de pagamento do site.

## Credenciais do Mercado Pago

**IMPORTANTE: Estas credenciais nunca devem ser expostas no frontend da aplicação.**

- **Access Token**: `APP_USR-4583794868030394-091709-fcebdf38c884e8d491752990802199a1-644952447`
- **Client ID**: `4583794868030394`
- **Client Secret**: `rTHNG6Xgg2Y7FXjaAgjs6okw2pMsjsW1`
- **Public Key**: `APP_USR-38686b62-6d55-4c0f-8d9a-487f1a3bbb25` (Esta é a única que pode ser usada no frontend)

## Arquitetura da Integração

A integração com o Mercado Pago deve seguir o seguinte fluxo:

1. O frontend coleta os dados do cliente e do pedido
2. O frontend envia esses dados para o backend
3. O backend cria uma preferência de pagamento usando o SDK do Mercado Pago
4. O backend retorna o ID da preferência para o frontend
5. O frontend redireciona o usuário para o checkout do Mercado Pago usando o ID da preferência
6. O Mercado Pago notifica o backend sobre o status do pagamento (via webhook)
7. O backend atualiza o status do pedido no sistema

## Implementação do Backend

### 1. Configuração do Ambiente

```javascript
// Instalar dependências
// npm install mercadopago

// Importar o SDK do Mercado Pago
const mercadopago = require('mercadopago');

// Configurar o SDK com o access token
mercadopago.configure({
  access_token: 'APP_USR-4583794868030394-091709-fcebdf38c884e8d491752990802199a1-644952447'
});
```

### 2. Criar Endpoint para Gerar Preferência

```javascript
// Exemplo usando Express.js
app.post('/api/create-preference', async (req, res) => {
  try {
    // Receber dados do frontend
    const { items, payer, shipments, back_urls, auto_return, external_reference } = req.body;
    
    // Criar preferência
    const preference = {
      items: items,
      payer: payer,
      shipments: shipments,
      back_urls: back_urls,
      auto_return: auto_return,
      external_reference: external_reference,
      statement_descriptor: 'Moda Online',
      notification_url: 'https://seu-dominio.com/api/webhook/mercadopago'
    };
    
    // Enviar para o Mercado Pago
    const response = await mercadopago.preferences.create(preference);
    
    // Retornar dados para o frontend
    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
  }
});
```

### 3. Configurar Webhook para Receber Notificações

```javascript
app.post('/api/webhook/mercadopago', async (req, res) => {
  try {
    // Verificar tipo de notificação
    const { type, data } = req.body;
    
    if (type === 'payment') {
      // Buscar informações do pagamento
      const paymentId = data.id;
      const payment = await mercadopago.payment.findById(paymentId);
      
      // Extrair informações relevantes
      const { status, status_detail, external_reference } = payment.body;
      
      // Atualizar status do pedido no seu sistema
      // Aqui você deve implementar a lógica para atualizar o pedido no seu banco de dados
      await updateOrderStatus(external_reference, status, status_detail);
      
      // Enviar email de confirmação para o cliente
      // Aqui você pode implementar o envio de email
    }
    
    res.status(200).end();
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).end();
  }
});

async function updateOrderStatus(orderId, status, statusDetail) {
  // Implementar lógica para atualizar o status do pedido no banco de dados
  // Por exemplo:
  // await db.collection('orders').updateOne(
  //   { external_reference: orderId },
  //   { $set: { payment_status: status, payment_status_detail: statusDetail } }
  // );
}
```

### 4. Segurança

- Sempre use HTTPS para todas as comunicações
- Nunca exponha o access token, client id ou client secret no frontend
- Valide todos os dados recebidos do frontend antes de enviá-los ao Mercado Pago
- Implemente autenticação para garantir que apenas usuários autorizados possam criar preferências
- Verifique a assinatura das notificações recebidas pelo webhook

## Ambiente de Teste vs. Produção

O Mercado Pago oferece um ambiente de testes (sandbox) para que você possa testar a integração sem realizar pagamentos reais.

### Configuração do Ambiente de Teste

1. No painel do Mercado Pago, acesse a seção de Desenvolvedores
2. Alterne para o modo de teste
3. Use os cartões de teste fornecidos pelo Mercado Pago para simular pagamentos

### Cartões de Teste

- **Mastercard**: 5031 7557 3453 0604
- **Visa**: 4509 9535 6623 3704
- **American Express**: 3711 8030 3257 522

Para todos os cartões, use:
- **Código de segurança**: 123
- **Data de validade**: Qualquer data futura
- **Nome do titular**: APRO (para aprovado) ou OTHE (para recusado)

## Próximos Passos

1. Implementar o backend conforme descrito acima
2. Configurar o ambiente de teste do Mercado Pago
3. Testar a integração completa
4. Monitorar os pagamentos e notificações
5. Implementar tratamento de erros e recuperação

## Recursos Adicionais

- [Documentação oficial do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing)
- [SDK do Mercado Pago para Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Exemplos de integração](https://github.com/mercadopago/code-examples)

                   SSUUMMMMAARRYY OOFF LLEESSSS CCOOMMMMAANNDDSS

      Commands marked with * may be preceded by a number, _N.
      Notes in parentheses indicate the behavior if _N is given.
      A key preceded by a caret indicates the Ctrl key; thus ^K is ctrl-K.

  h  H                 Display this help.
  q  :q  Q  :Q  ZZ     Exit.
 ---------------------------------------------------------------------------

                           MMOOVVIINNGG

  e  ^E  j  ^N  CR  *  Forward  one line   (or _N lines).
  y  ^Y  k  ^K  ^P  *  Backward one line   (or _N lines).
  f  ^F  ^V  SPACE  *  Forward  one window (or _N lines).
  b  ^B  ESC-v      *  Backward one window (or _N lines).
  z                 *  Forward  one window (and set window to _N).
  w                 *  Backward one window (and set window to _N).
  ESC-SPACE         *  Forward  one window, but don't stop at end-of-file.
  d  ^D             *  Forward  one half-window (and set half-window to _N).
  u  ^U             *  Backward one half-window (and set half-window to _N).
  ESC-)  RightArrow *  Right one half screen width (or _N positions).
  ESC-(  LeftArrow  *  Left  one half screen width (or _N positions).
  ESC-}  ^RightArrow   Right to last column displayed.
  ESC-{  ^LeftArrow    Left  to first column.
  F                    Forward forever; like "tail -f".
  ESC-F                Like F but stop when search pattern is found.
  r  ^R  ^L            Repaint screen.
  R                    Repaint screen, discarding buffered input.
        ---------------------------------------------------
        Default "window" is the screen height.
        Default "half-window" is half of the screen height.
 ---------------------------------------------------------------------------

                          SSEEAARRCCHHIINNGG

  /_p_a_t_t_e_r_n          *  Search forward for (_N-th) matching line.
  ?_p_a_t_t_e_r_n          *  Search backward for (_N-th) matching line.
  n                 *  Repeat previous search (for _N-th occurrence).
  N                 *  Repeat previous search in reverse direction.
  ESC-n             *  Repeat previous search, spanning files.
  ESC-N             *  Repeat previous search, reverse dir. & spanning files.
  ^O^N  ^On         *  Search forward for (_N-th) OSC8 hyperlink.
  ^O^P  ^Op         *  Search backward for (_N-th) OSC8 hyperlink.
  ^O^L  ^Ol            Jump to the currently selected OSC8 hyperlink.
  ESC-u                Undo (toggle) search highlighting.
  ESC-U                Clear search highlighting.
  &_p_a_t_t_e_r_n          *  Display only matching lines.
        ---------------------------------------------------
        A search pattern may begin with one or more of:
        ^N or !  Search for NON-matching lines.
        ^E or *  Search multiple files (pass thru END OF FILE).
        ^F or @  Start search at FIRST file (for /) or last file (for ?).
        ^K       Highlight matches, but don't move (KEEP position).
        ^R       Don't use REGULAR EXPRESSIONS.
        ^S _n     Search for match in _n-th parenthesized subpattern.
        ^W       WRAP search if no match found.
        ^L       Enter next character literally into pattern.
 ---------------------------------------------------------------------------

                           JJUUMMPPIINNGG

  g  <  ESC-<       *  Go to first line in file (or line _N).
  G  >  ESC->       *  Go to last line in file (or line _N).
  p  %              *  Go to beginning of file (or _N percent into file).
  t                 *  Go to the (_N-th) next tag.
  T                 *  Go to the (_N-th) previous tag.
  {  (  [           *  Find close bracket } ) ].
  }  )  ]           *  Find open bracket { ( [.
  ESC-^F _<_c_1_> _<_c_2_>  *  Find close bracket _<_c_2_>.
  ESC-^B _<_c_1_> _<_c_2_>  *  Find open bracket _<_c_1_>.
        ---------------------------------------------------
        Each "find close bracket" command goes forward to the close bracket 
          matching the (_N-th) open bracket in the top line.
        Each "find open bracket" command goes backward to the open bracket 
          matching the (_N-th) close bracket in the bottom line.

  m_<_l_e_t_t_e_r_>            Mark the current top line with <letter>.
  M_<_l_e_t_t_e_r_>            Mark the current bottom line with <letter>.
  '_<_l_e_t_t_e_r_>            Go to a previously marked position.
  ''                   Go to the previous position.
  ^X^X                 Same as '.
  ESC-m_<_l_e_t_t_e_r_>        Clear a mark.
        ---------------------------------------------------
        A mark is any upper-case or lower-case letter.
        Certain marks are predefined:
             ^  means  beginning of the file
             $  means  end of the file
 ---------------------------------------------------------------------------

                        CCHHAANNGGIINNGG FFIILLEESS

  :e [_f_i_l_e]            Examine a new file.
  ^X^V                 Same as :e.
  :n                *  Examine the (_N-th) next file from the command line.
  :p                *  Examine the (_N-th) previous file from the command line.
  :x                *  Examine the first (or _N-th) file from the command line.
  ^O^O                 Open the currently selected OSC8 hyperlink.
  :d                   Delete the current file from the command line list.
  =  ^G  :f            Print current file name.
 ---------------------------------------------------------------------------

                    MMIISSCCEELLLLAANNEEOOUUSS CCOOMMMMAANNDDSS

  -_<_f_l_a_g_>              Toggle a command line option [see OPTIONS below].
  --_<_n_a_m_e_>             Toggle a command line option, by name.
  __<_f_l_a_g_>              Display the setting of a command line option.
  ___<_n_a_m_e_>             Display the setting of an option, by name.
  +_c_m_d                 Execute the less cmd each time a new file is examined.

  !_c_o_m_m_a_n_d             Execute the shell command with $SHELL.
  #_c_o_m_m_a_n_d             Execute the shell command, expanded like a prompt.
  |XX_c_o_m_m_a_n_d            Pipe file between current pos & mark XX to shell command.
  s _f_i_l_e               Save input to a file.
  v                    Edit the current file with $VISUAL or $EDITOR.
  V                    Print version number of "less".
 ---------------------------------------------------------------------------

                           OOPPTTIIOONNSS

        Most options may be changed either on the command line,
        or from within less by using the - or -- command.
        Options may be given in one of two forms: either a single
        character preceded by a -, or a name preceded by --.

  -?  ........  --help
                  Display help (from command line).
  -a  ........  --search-skip-screen
                  Search skips current screen.
  -A  ........  --SEARCH-SKIP-SCREEN
                  Search starts just after target line.
  -b [_N]  ....  --buffers=[_N]
                  Number of buffers.
  -B  ........  --auto-buffers
                  Don't automatically allocate buffers for pipes.
  -c  ........  --clear-screen
                  Repaint by clearing rather than scrolling.
  -d  ........  --dumb
                  Dumb terminal.
  -D xx_c_o_l_o_r  .  --color=xx_c_o_l_o_r
                  Set screen colors.
  -e  -E  ....  --quit-at-eof  --QUIT-AT-EOF
                  Quit at end of file.
  -f  ........  --force
                  Force open non-regular files.
  -F  ........  --quit-if-one-screen
                  Quit if entire file fits on first screen.
  -g  ........  --hilite-search
                  Highlight only last match for searches.
  -G  ........  --HILITE-SEARCH
                  Don't highlight any matches for searches.
  -h [_N]  ....  --max-back-scroll=[_N]
                  Backward scroll limit.
  -i  ........  --ignore-case
                  Ignore case in searches that do not contain uppercase.
  -I  ........  --IGNORE-CASE
                  Ignore case in all searches.
  -j [_N]  ....  --jump-target=[_N]
                  Screen position of target lines.
  -J  ........  --status-column
                  Display a status column at left edge of screen.
  -k _f_i_l_e  ...  --lesskey-file=_f_i_l_e
                  Use a compiled lesskey file.
  -K  ........  --quit-on-intr
                  Exit less in response to ctrl-C.
  -L  ........  --no-lessopen
                  Ignore the LESSOPEN environment variable.
  -m  -M  ....  --long-prompt  --LONG-PROMPT
                  Set prompt style.
  -n .........  --line-numbers
                  Suppress line numbers in prompts and messages.
  -N .........  --LINE-NUMBERS
                  Display line number at start of each line.
  -o [_f_i_l_e] ..  --log-file=[_f_i_l_e]
                  Copy to log file (standard input only).
  -O [_f_i_l_e] ..  --LOG-FILE=[_f_i_l_e]
                  Copy to log file (unconditionally overwrite).
  -p _p_a_t_t_e_r_n .  --pattern=[_p_a_t_t_e_r_n]
                  Start at pattern (from command line).
  -P [_p_r_o_m_p_t]   --prompt=[_p_r_o_m_p_t]
                  Define new prompt.
  -q  -Q  ....  --quiet  --QUIET  --silent --SILENT
                  Quiet the terminal bell.
  -r  -R  ....  --raw-control-chars  --RAW-CONTROL-CHARS
                  Output "raw" control characters.
  -s  ........  --squeeze-blank-lines
                  Squeeze multiple blank lines.
  -S  ........  --chop-long-lines
                  Chop (truncate) long lines rather than wrapping.
  -t _t_a_g  ....  --tag=[_t_a_g]
                  Find a tag.
  -T [_t_a_g_s_f_i_l_e] --tag-file=[_t_a_g_s_f_i_l_e]
                  Use an alternate tags file.
  -u  -U  ....  --underline-special  --UNDERLINE-SPECIAL
                  Change handling of backspaces, tabs and carriage returns.
  -V  ........  --version
                  Display the version number of "less".
  -w  ........  --hilite-unread
                  Highlight first new line after forward-screen.
  -W  ........  --HILITE-UNREAD
                  Highlight first new line after any forward movement.
  -x [_N[,...]]  --tabs=[_N[,...]]
                  Set tab stops.
  -X  ........  --no-init
                  Don't use termcap init/deinit strings.
  -y [_N]  ....  --max-forw-scroll=[_N]
                  Forward scroll limit.
  -z [_N]  ....  --window=[_N]
                  Set size of window.
  -" [_c[_c]]  .  --quotes=[_c[_c]]
                  Set shell quote characters.
  -~  ........  --tilde
                  Don't display tildes after end of file.
  -# [_N]  ....  --shift=[_N]
                  Set horizontal scroll amount (0 = one half screen width).

                --exit-follow-on-close
                  Exit F command on a pipe when writer closes pipe.
                --file-size
                  Automatically determine the size of the input file.
                --follow-name
                  The F command changes files if the input file is renamed.
                --header=[_L[,_C[,_N]]]
                  Use _L lines (starting at line _N) and _C columns as headers.
                --incsearch
                  Search file as each pattern character is typed in.
                --intr=[_C]
                  Use _C instead of ^X to interrupt a read.
                --lesskey-context=_t_e_x_t
                  Use lesskey source file contents.
                --lesskey-src=_f_i_l_e
                  Use a lesskey source file.
                --line-num-width=[_N]
                  Set the width of the -N line number field to _N characters.
                --match-shift=[_N]
                  Show at least _N characters to the left of a search match.
                --modelines=[_N]
                  Read _N lines from the input file and look for vim modelines.
                --mouse
                  Enable mouse input.
                --no-keypad
                  Don't send termcap keypad init/deinit strings.
                --no-histdups
                  Remove duplicates from command history.
                --no-number-headers
                  Don't give line numbers to header lines.
                --no-search-header-lines
                  Searches do not include header lines.
                --no-search-header-columns
                  Searches do not include header columns.
                --no-search-headers
                  Searches do not include header lines or columns.
                --no-vbell
                  Disable the terminal's visual bell.
                --redraw-on-quit
                  Redraw final screen when quitting.
                --rscroll=[_C]
                  Set the character used to mark truncated lines.
                --save-marks
                  Retain marks across invocations of less.
                --search-options=[EFKNRW-]
                  Set default options for every search.
                --show-preproc-errors
                  Display a message if preprocessor exits with an error status.
                --proc-backspace
                  Process backspaces for bold/underline.
                --PROC-BACKSPACE
                  Treat backspaces as control characters.
                --proc-return
                  Delete carriage returns before newline.
                --PROC-RETURN
                  Treat carriage returns as control characters.
                --proc-tab
                  Expand tabs to spaces.
                --PROC-TAB
                  Treat tabs as control characters.
                --status-col-width=[_N]
                  Set the width of the -J status column to _N characters.
                --status-line
                  Highlight or color the entire line containing a mark.
                --use-backslash
                  Subsequent options use backslash as escape char.
                --use-color
                  Enables colored text.
                --wheel-lines=[_N]
                  Each click of the mouse wheel moves _N lines.
                --wordwrap
                  Wrap lines at spaces.


 ---------------------------------------------------------------------------

                          LLIINNEE EEDDIITTIINNGG

        These keys can be used to edit text being entered 
        on the "command line" at the bottom of the screen.

 RightArrow ..................... ESC-l ... Move cursor right one character.
 LeftArrow ...................... ESC-h ... Move cursor left one character.
 ctrl-RightArrow  ESC-RightArrow  ESC-w ... Move cursor right one word.
 ctrl-LeftArrow   ESC-LeftArrow   ESC-b ... Move cursor left one word.
 HOME ........................... ESC-0 ... Move cursor to start of line.
 END ............................ ESC-$ ... Move cursor to end of line.
 BACKSPACE ................................ Delete char to left of cursor.
 DELETE ......................... ESC-x ... Delete char under cursor.
 ctrl-BACKSPACE   ESC-BACKSPACE ........... Delete word to left of cursor.
 ctrl-DELETE .... ESC-DELETE .... ESC-X ... Delete word under cursor.
 ctrl-U ......... ESC (MS-DOS only) ....... Delete entire line.
 UpArrow ........................ ESC-k ... Retrieve previous command line.
 DownArrow ...................... ESC-j ... Retrieve next command line.
 TAB ...................................... Complete filename & cycle.
 SHIFT-TAB ...................... ESC-TAB   Complete filename & reverse cycle.
 ctrl-L ................................... Complete filename, list all.
