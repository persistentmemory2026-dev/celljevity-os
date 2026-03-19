// HTML email templates for Celljevity

const STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; margin: 0; padding: 0; background: #f8f9fa; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { text-align: center; margin-bottom: 24px; }
  .logo { font-size: 24px; font-weight: 700; color: #78e0ad; }
  h1 { font-size: 20px; margin: 0 0 16px; }
  p { line-height: 1.6; margin: 0 0 12px; color: #4a4a6a; }
  .highlight { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .inbox-address { font-family: monospace; font-size: 14px; color: #78e0ad; font-weight: 600; }
  .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
  table.items { width: 100%; border-collapse: collapse; margin: 16px 0; }
  table.items th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
  table.items td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
  table.items td.right, table.items th.right { text-align: right; }
  .total-row { font-weight: 700; font-size: 16px; }
  .total-row td { border-top: 2px solid #1a1a2e; padding-top: 12px; }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrap(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>${STYLE}</style></head><body><div class="container">${body}</div></body></html>`;
}

// ─── Translation maps ──────────────────────────────────────────────

const welcomeTranslations: Record<string, {
  subject: string;
  greeting: string;
  intro: string;
  emailLabel: string;
  features: string[];
  sendInstructions: string;
  questions: string;
  signOff: string;
  team: string;
  footer: string;
}> = {
  en: {
    subject: "Welcome to Celljevity — Your Personal Health Record",
    greeting: "Welcome",
    intro: "We are delighted to welcome you to Celljevity. Your personal health record has been set up.",
    emailLabel: "Your personal email address:",
    features: [
      "Submit documents via email (lab reports, medical letters, etc.)",
      "Receive quotes and invoices directly by email",
      "All documents are automatically linked to your record",
    ],
    sendInstructions: "Simply send an email with attachments to the address above — we'll take care of the rest.",
    questions: "If you have any questions, please don't hesitate to contact us.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    subject: "Willkommen bei Celljevity — Ihre persönliche Gesundheitsakte",
    greeting: "Willkommen",
    intro: "Wir freuen uns, Sie bei Celljevity begrüßen zu dürfen. Ihre persönliche Gesundheitsakte wurde eingerichtet.",
    emailLabel: "Ihre persönliche E-Mail-Adresse:",
    features: [
      "Dokumente per E-Mail einsenden (Laborbefunde, Arztbriefe etc.)",
      "Angebote und Rechnungen direkt per E-Mail empfangen",
      "Alle Dokumente werden automatisch Ihrer Akte zugeordnet",
    ],
    sendInstructions: "Senden Sie einfach eine E-Mail mit Anhängen an die oben genannte Adresse — wir kümmern uns um den Rest.",
    questions: "Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    subject: "Welkom bij Celljevity — Uw persoonlijk gezondheidsdossier",
    greeting: "Welkom",
    intro: "Wij verwelkomen u graag bij Celljevity. Uw persoonlijk gezondheidsdossier is aangemaakt.",
    emailLabel: "Uw persoonlijk e-mailadres:",
    features: [
      "Documenten per e-mail indienen (laboratoriumuitslagen, artsenbrieven, enz.)",
      "Offertes en facturen direct per e-mail ontvangen",
      "Alle documenten worden automatisch aan uw dossier gekoppeld",
    ],
    sendInstructions: "Stuur eenvoudig een e-mail met bijlagen naar het bovenstaande adres — wij doen de rest.",
    questions: "Heeft u vragen? Neem gerust contact met ons op.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    subject: "Bienvenue chez Celljevity — Votre dossier de santé personnel",
    greeting: "Bienvenue",
    intro: "Nous sommes ravis de vous accueillir chez Celljevity. Votre dossier de santé personnel a été créé.",
    emailLabel: "Votre adresse e-mail personnelle :",
    features: [
      "Envoyer des documents par e-mail (résultats de laboratoire, courriers médicaux, etc.)",
      "Recevoir des devis et factures directement par e-mail",
      "Tous les documents sont automatiquement associés à votre dossier",
    ],
    sendInstructions: "Envoyez simplement un e-mail avec des pièces jointes à l'adresse ci-dessus — nous nous occupons du reste.",
    questions: "Pour toute question, n'hésitez pas à nous contacter.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    subject: "Bienvenido a Celljevity — Su expediente de salud personal",
    greeting: "Bienvenido/a",
    intro: "Nos complace darle la bienvenida a Celljevity. Su expediente de salud personal ha sido configurado.",
    emailLabel: "Su dirección de correo electrónico personal:",
    features: [
      "Enviar documentos por correo electrónico (informes de laboratorio, cartas médicas, etc.)",
      "Recibir presupuestos y facturas directamente por correo electrónico",
      "Todos los documentos se vinculan automáticamente a su expediente",
    ],
    sendInstructions: "Simplemente envíe un correo electrónico con archivos adjuntos a la dirección indicada — nosotros nos encargamos del resto.",
    questions: "Si tiene alguna pregunta, no dude en contactarnos.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    subject: "Benvenuto su Celljevity — La sua cartella sanitaria personale",
    greeting: "Benvenuto/a",
    intro: "Siamo lieti di darle il benvenuto su Celljevity. La sua cartella sanitaria personale è stata creata.",
    emailLabel: "Il suo indirizzo e-mail personale:",
    features: [
      "Inviare documenti via e-mail (referti di laboratorio, lettere mediche, ecc.)",
      "Ricevere preventivi e fatture direttamente via e-mail",
      "Tutti i documenti vengono automaticamente associati alla sua cartella",
    ],
    sendInstructions: "Invii semplicemente un'e-mail con allegati all'indirizzo sopra indicato — pensiamo a tutto noi.",
    questions: "Per qualsiasi domanda, non esiti a contattarci.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    subject: "Bem-vindo ao Celljevity — O seu registo de saúde pessoal",
    greeting: "Bem-vindo/a",
    intro: "Temos o prazer de lhe dar as boas-vindas ao Celljevity. O seu registo de saúde pessoal foi criado.",
    emailLabel: "O seu endereço de e-mail pessoal:",
    features: [
      "Enviar documentos por e-mail (relatórios de laboratório, cartas médicas, etc.)",
      "Receber orçamentos e faturas diretamente por e-mail",
      "Todos os documentos são automaticamente associados ao seu registo",
    ],
    sendInstructions: "Basta enviar um e-mail com anexos para o endereço acima — nós tratamos do resto.",
    questions: "Se tiver alguma dúvida, não hesite em contactar-nos.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

const quoteTranslations: Record<string, {
  invoice: string;
  quote: string;
  greeting: string;
  attachedInvoice: string;
  attachedQuote: string;
  service: string;
  qty: string;
  unitPrice: string;
  total: string;
  subtotal: string;
  vatLabel: string;
  grandTotal: string;
  notes: string;
  questions: string;
  signOff: string;
  team: string;
  items: string;
  footer: string;
}> = {
  en: {
    invoice: "Invoice",
    quote: "Quote",
    greeting: "Dear",
    attachedInvoice: "please find your invoice attached.",
    attachedQuote: "please find your quote attached.",
    service: "Service",
    qty: "Qty",
    unitPrice: "Unit Price",
    total: "Total",
    subtotal: "Subtotal",
    vatLabel: "VAT",
    grandTotal: "Grand Total",
    notes: "Notes:",
    questions: "If you have any questions, please don't hesitate to contact us.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
    items: "Items:",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    invoice: "Rechnung",
    quote: "Angebot",
    greeting: "Sehr geehrte/r",
    attachedInvoice: "anbei finden Sie Ihre Rechnung.",
    attachedQuote: "anbei finden Sie Ihr Angebot.",
    service: "Leistung",
    qty: "Menge",
    unitPrice: "Einzelpreis",
    total: "Gesamt",
    subtotal: "Zwischensumme",
    vatLabel: "MwSt.",
    grandTotal: "Gesamtbetrag",
    notes: "Anmerkungen:",
    questions: "Bei Fragen stehen wir Ihnen gerne zur Verfügung.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
    items: "Positionen:",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    invoice: "Factuur",
    quote: "Offerte",
    greeting: "Geachte",
    attachedInvoice: "hierbij vindt u uw factuur.",
    attachedQuote: "hierbij vindt u uw offerte.",
    service: "Dienst",
    qty: "Aantal",
    unitPrice: "Eenheidsprijs",
    total: "Totaal",
    subtotal: "Subtotaal",
    vatLabel: "BTW",
    grandTotal: "Totaalbedrag",
    notes: "Opmerkingen:",
    questions: "Heeft u vragen? Neem gerust contact met ons op.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
    items: "Posten:",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    invoice: "Facture",
    quote: "Devis",
    greeting: "Cher/Chère",
    attachedInvoice: "veuillez trouver ci-joint votre facture.",
    attachedQuote: "veuillez trouver ci-joint votre devis.",
    service: "Service",
    qty: "Qté",
    unitPrice: "Prix unitaire",
    total: "Total",
    subtotal: "Sous-total",
    vatLabel: "TVA",
    grandTotal: "Montant total",
    notes: "Remarques :",
    questions: "Pour toute question, n'hésitez pas à nous contacter.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
    items: "Postes :",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    invoice: "Factura",
    quote: "Presupuesto",
    greeting: "Estimado/a",
    attachedInvoice: "adjunto encontrará su factura.",
    attachedQuote: "adjunto encontrará su presupuesto.",
    service: "Servicio",
    qty: "Cant.",
    unitPrice: "Precio unitario",
    total: "Total",
    subtotal: "Subtotal",
    vatLabel: "IVA",
    grandTotal: "Importe total",
    notes: "Observaciones:",
    questions: "Si tiene alguna pregunta, no dude en contactarnos.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
    items: "Partidas:",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    invoice: "Fattura",
    quote: "Preventivo",
    greeting: "Gentile",
    attachedInvoice: "in allegato trova la sua fattura.",
    attachedQuote: "in allegato trova il suo preventivo.",
    service: "Servizio",
    qty: "Qtà",
    unitPrice: "Prezzo unitario",
    total: "Totale",
    subtotal: "Subtotale",
    vatLabel: "IVA",
    grandTotal: "Importo totale",
    notes: "Note:",
    questions: "Per qualsiasi domanda, non esiti a contattarci.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
    items: "Voci:",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    invoice: "Fatura",
    quote: "Orçamento",
    greeting: "Caro/a",
    attachedInvoice: "em anexo encontra a sua fatura.",
    attachedQuote: "em anexo encontra o seu orçamento.",
    service: "Serviço",
    qty: "Qtd.",
    unitPrice: "Preço unitário",
    total: "Total",
    subtotal: "Subtotal",
    vatLabel: "IVA",
    grandTotal: "Valor total",
    notes: "Observações:",
    questions: "Se tiver alguma dúvida, não hesite em contactar-nos.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
    items: "Itens:",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

const docNotificationTranslations: Record<string, {
  subject: (name: string) => string;
  heading: string;
  body: (count: number, sender: string, name: string) => string;
  available: string;
  signOff: string;
  team: string;
}> = {
  en: {
    subject: (name) => `New documents received — ${name}`,
    heading: "New documents received",
    body: (count, sender, name) => `${count} document(s) from <strong>${sender}</strong> have been added to the record of <strong>${name}</strong>.`,
    available: "The documents are now available in the Documents section.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
  },
  de: {
    subject: (name) => `Neue Dokumente erhalten — ${name}`,
    heading: "Neue Dokumente eingegangen",
    body: (count, sender, name) => `${count} Dokument(e) von <strong>${sender}</strong> wurden der Akte von <strong>${name}</strong> hinzugefügt.`,
    available: "Die Dokumente stehen ab sofort im Dokumenten-Bereich zur Verfügung.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
  },
  nl: {
    subject: (name) => `Nieuwe documenten ontvangen — ${name}`,
    heading: "Nieuwe documenten ontvangen",
    body: (count, sender, name) => `${count} document(en) van <strong>${sender}</strong> zijn toegevoegd aan het dossier van <strong>${name}</strong>.`,
    available: "De documenten zijn nu beschikbaar in het Documenten-gedeelte.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
  },
  fr: {
    subject: (name) => `Nouveaux documents reçus — ${name}`,
    heading: "Nouveaux documents reçus",
    body: (count, sender, name) => `${count} document(s) de <strong>${sender}</strong> ont été ajoutés au dossier de <strong>${name}</strong>.`,
    available: "Les documents sont désormais disponibles dans la section Documents.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
  },
  es: {
    subject: (name) => `Nuevos documentos recibidos — ${name}`,
    heading: "Nuevos documentos recibidos",
    body: (count, sender, name) => `${count} documento(s) de <strong>${sender}</strong> se han añadido al expediente de <strong>${name}</strong>.`,
    available: "Los documentos están ahora disponibles en la sección Documentos.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
  },
  it: {
    subject: (name) => `Nuovi documenti ricevuti — ${name}`,
    heading: "Nuovi documenti ricevuti",
    body: (count, sender, name) => `${count} documento/i da <strong>${sender}</strong> sono stati aggiunti alla cartella di <strong>${name}</strong>.`,
    available: "I documenti sono ora disponibili nella sezione Documenti.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
  },
  pt: {
    subject: (name) => `Novos documentos recebidos — ${name}`,
    heading: "Novos documentos recebidos",
    body: (count, sender, name) => `${count} documento(s) de <strong>${sender}</strong> foram adicionados ao registo de <strong>${name}</strong>.`,
    available: "Os documentos estão agora disponíveis na secção Documentos.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
  },
};

const inviteTranslations: Record<string, {
  subject: string;
  greeting: string;
  intro: string;
  buttonLabel: string;
  expiryNotice: string;
  ignoreNotice: string;
  signOff: string;
  team: string;
  footer: string;
}> = {
  en: {
    subject: "You're invited to access your Celljevity health dashboard",
    greeting: "Hello",
    intro: "You have been invited to access your personal health dashboard at Celljevity. Click the link below to set your password and get started.",
    buttonLabel: "Set My Password",
    expiryNotice: "This link expires in 72 hours.",
    ignoreNotice: "If you did not expect this email, please ignore it.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    subject: "Einladung zu Ihrem Celljevity Gesundheits-Dashboard",
    greeting: "Hallo",
    intro: "Sie wurden eingeladen, auf Ihr persönliches Gesundheits-Dashboard bei Celljevity zuzugreifen. Klicken Sie auf den untenstehenden Link, um Ihr Passwort festzulegen.",
    buttonLabel: "Mein Passwort festlegen",
    expiryNotice: "Dieser Link ist 72 Stunden gültig.",
    ignoreNotice: "Wenn Sie diese E-Mail nicht erwartet haben, ignorieren Sie sie bitte.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    subject: "U bent uitgenodigd voor uw Celljevity gezondheidsdashboard",
    greeting: "Hallo",
    intro: "U bent uitgenodigd om toegang te krijgen tot uw persoonlijke gezondheidsdashboard bij Celljevity. Klik op de onderstaande link om uw wachtwoord in te stellen.",
    buttonLabel: "Mijn wachtwoord instellen",
    expiryNotice: "Deze link verloopt over 72 uur.",
    ignoreNotice: "Als u deze e-mail niet verwachtte, kunt u deze negeren.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    subject: "Invitation à accéder à votre tableau de bord santé Celljevity",
    greeting: "Bonjour",
    intro: "Vous avez été invité(e) à accéder à votre tableau de bord santé personnel chez Celljevity. Cliquez sur le lien ci-dessous pour définir votre mot de passe.",
    buttonLabel: "Définir mon mot de passe",
    expiryNotice: "Ce lien expire dans 72 heures.",
    ignoreNotice: "Si vous n'attendiez pas cet e-mail, veuillez l'ignorer.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    subject: "Invitación a su panel de salud Celljevity",
    greeting: "Hola",
    intro: "Ha sido invitado/a a acceder a su panel de salud personal en Celljevity. Haga clic en el enlace a continuación para establecer su contraseña.",
    buttonLabel: "Establecer mi contraseña",
    expiryNotice: "Este enlace caduca en 72 horas.",
    ignoreNotice: "Si no esperaba este correo, por favor ignórelo.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    subject: "Invito ad accedere alla sua dashboard sanitaria Celljevity",
    greeting: "Salve",
    intro: "È stato/a invitato/a ad accedere alla sua dashboard sanitaria personale su Celljevity. Clicchi sul link qui sotto per impostare la sua password.",
    buttonLabel: "Imposta la mia password",
    expiryNotice: "Questo link scade tra 72 ore.",
    ignoreNotice: "Se non si aspettava questa e-mail, la ignori.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    subject: "Convite para aceder ao seu painel de saúde Celljevity",
    greeting: "Olá",
    intro: "Foi convidado/a a aceder ao seu painel de saúde pessoal na Celljevity. Clique no link abaixo para definir a sua palavra-passe.",
    buttonLabel: "Definir a minha palavra-passe",
    expiryNotice: "Este link expira em 72 horas.",
    ignoreNotice: "Se não esperava este e-mail, por favor ignore-o.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

// ─── Locale for currency formatting ────────────────────────────────

const currencyLocale: Record<string, string> = {
  en: "en-DE", // EUR formatted in English style but with EUR symbol
  de: "de-DE",
  nl: "nl-NL",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-PT",
};

// ─── Template functions ─────────────────────────────────────────────

export function welcomeEmail(
  patient: { firstName: string; lastName: string; agentmailAddress: string },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = welcomeTranslations[language] ?? welcomeTranslations["en"];

  const featureListHtml = t.features.map((f) => `<li>${f}</li>`).join("");
  const featureListText = t.features.map((f) => `- ${f}`).join("\n");

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${t.greeting}, ${escapeHtml(patient.firstName)} ${escapeHtml(patient.lastName)}!</h1>
      <p>${t.intro}</p>
      <div class="highlight">
        <p style="margin:0 0 8px;font-weight:600;">${t.emailLabel}</p>
        <p class="inbox-address" style="margin:0;">${escapeHtml(patient.agentmailAddress)}</p>
      </div>
      <ul style="color:#4a4a6a;line-height:1.8;">${featureListHtml}</ul>
      <p>${t.sendInstructions}</p>
      <p>${t.questions}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const text = `${t.greeting}, ${patient.firstName} ${patient.lastName}!

${t.intro}

${t.emailLabel} ${patient.agentmailAddress}

${featureListText}

${t.sendInstructions}

${t.signOff}
${t.team}`;

  return { subject: t.subject, html, text };
}

export function quoteEmail(
  quote: {
    quoteNumber: string;
    type: string;
    customerName: string;
    items: Array<{ serviceName: string; quantity: number; unitPrice: number; total: number }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string;
  },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = quoteTranslations[language] ?? quoteTranslations["en"];
  const isInvoice = quote.type === "invoice";
  const docType = isInvoice ? t.invoice : t.quote;
  const subject = `${docType} ${quote.quoteNumber} — Celljevity`;

  const locale = currencyLocale[language] ?? "en-DE";
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(n);

  const itemRows = quote.items
    .map(
      (item) => `
    <tr>
      <td>${item.serviceName}</td>
      <td class="right">${item.quantity}</td>
      <td class="right">${formatCurrency(item.unitPrice)}</td>
      <td class="right">${formatCurrency(item.total)}</td>
    </tr>`
    )
    .join("");

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${docType} ${quote.quoteNumber}</h1>
      <p>${t.greeting} ${escapeHtml(quote.customerName)},</p>
      <p>${isInvoice ? t.attachedInvoice : t.attachedQuote}</p>
      <table class="items">
        <thead>
          <tr>
            <th>${t.service}</th>
            <th class="right">${t.qty}</th>
            <th class="right">${t.unitPrice}</th>
            <th class="right">${t.total}</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr><td colspan="3" style="text-align:right;padding-top:12px;">${t.subtotal}</td><td class="right" style="padding-top:12px;">${formatCurrency(quote.subtotal)}</td></tr>
          <tr><td colspan="3" style="text-align:right;">${t.vatLabel} (${quote.taxRate}%)</td><td class="right">${formatCurrency(quote.taxAmount)}</td></tr>
          <tr class="total-row"><td colspan="3" style="text-align:right;">${t.grandTotal}</td><td class="right">${formatCurrency(quote.total)}</td></tr>
        </tbody>
      </table>
      ${quote.notes ? `<div class="highlight"><p style="margin:0;"><strong>${t.notes}</strong> ${quote.notes}</p></div>` : ""}
      <p>${t.questions}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const itemLines = quote.items
    .map((item) => `  - ${item.serviceName}: ${item.quantity}x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`)
    .join("\n");

  const text = `${docType} ${quote.quoteNumber}

${t.greeting} ${quote.customerName},

${isInvoice ? t.attachedInvoice : t.attachedQuote}

${t.items}
${itemLines}

${t.subtotal}: ${formatCurrency(quote.subtotal)}
${t.vatLabel} (${quote.taxRate}%): ${formatCurrency(quote.taxAmount)}
${t.grandTotal}: ${formatCurrency(quote.total)}
${quote.notes ? `\n${t.notes} ${quote.notes}` : ""}

${t.signOff}
${t.team}`;

  return { subject, html, text };
}

export function documentReceivedNotification(
  patient: { firstName: string; lastName: string; attachmentCount: number; senderEmail: string },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = docNotificationTranslations[language] ?? docNotificationTranslations["en"];
  const fullName = `${patient.firstName} ${patient.lastName}`;
  const safeFullName = escapeHtml(fullName);
  const subject = t.subject(fullName);

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${t.heading}</h1>
      <p>${t.body(patient.attachmentCount, escapeHtml(patient.senderEmail), safeFullName)}</p>
      <p>${t.available}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">Celljevity Longevity OS</div>
  `);

  const text = `${t.heading}

${patient.attachmentCount} document(s) from ${patient.senderEmail} — ${fullName}.

${t.available}

${t.signOff}
${t.team}`;

  return { subject, html, text };
}

export function inviteEmail(
  patient: { firstName: string; lastName: string },
  inviteUrl: string,
  language = "en",
): { subject: string; html: string; text: string } {
  const t = inviteTranslations[language] ?? inviteTranslations["en"];

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${t.greeting}, ${escapeHtml(patient.firstName)} ${escapeHtml(patient.lastName)}!</h1>
      <p>${t.intro}</p>
      <div class="highlight" style="text-align:center;">
        <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:12px 32px;background:#78e0ad;color:#1a1a2e;font-weight:700;text-decoration:none;border-radius:8px;font-size:16px;">${t.buttonLabel}</a>
      </div>
      <p style="font-size:13px;color:#9ca3af;">${t.expiryNotice}</p>
      <p style="font-size:13px;color:#9ca3af;">${t.ignoreNotice}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const text = `${t.greeting}, ${patient.firstName} ${patient.lastName}!

${t.intro}

${t.buttonLabel}: ${inviteUrl}

${t.expiryNotice}

${t.signOff}
${t.team}`;

  return { subject: t.subject, html, text };
}

// ─── Treatment Confirmation ─────────────────────────────────────────

const treatmentConfirmationTranslations: Record<string, {
  subject: (serviceName: string) => string;
  greeting: string;
  confirmed: (serviceName: string, date: string) => string;
  details: string;
  serviceLabel: string;
  dateLabel: string;
  preparation: string;
  questions: string;
  signOff: string;
  team: string;
  footer: string;
}> = {
  en: {
    subject: (s) => `Your ${s} appointment is confirmed`,
    greeting: "Dear",
    confirmed: (s, d) => `We are pleased to confirm your <strong>${s}</strong> appointment on <strong>${d}</strong>.`,
    details: "Appointment details",
    serviceLabel: "Service",
    dateLabel: "Date",
    preparation: "If you have any special preparation instructions, we will contact you separately.",
    questions: "If you have any questions, please don't hesitate to contact us.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    subject: (s) => `Ihr ${s}-Termin ist bestätigt`,
    greeting: "Sehr geehrte/r",
    confirmed: (s, d) => `Wir freuen uns, Ihren Termin für <strong>${s}</strong> am <strong>${d}</strong> zu bestätigen.`,
    details: "Termindetails",
    serviceLabel: "Leistung",
    dateLabel: "Datum",
    preparation: "Sollte es besondere Vorbereitungshinweise geben, werden wir Sie gesondert kontaktieren.",
    questions: "Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    subject: (s) => `Uw ${s}-afspraak is bevestigd`,
    greeting: "Geachte",
    confirmed: (s, d) => `Wij bevestigen graag uw afspraak voor <strong>${s}</strong> op <strong>${d}</strong>.`,
    details: "Afspraakgegevens",
    serviceLabel: "Dienst",
    dateLabel: "Datum",
    preparation: "Als er speciale voorbereidingsinstructies zijn, nemen wij apart contact met u op.",
    questions: "Heeft u vragen? Neem gerust contact met ons op.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    subject: (s) => `Votre rendez-vous ${s} est confirmé`,
    greeting: "Cher/Chère",
    confirmed: (s, d) => `Nous avons le plaisir de confirmer votre rendez-vous pour <strong>${s}</strong> le <strong>${d}</strong>.`,
    details: "Détails du rendez-vous",
    serviceLabel: "Service",
    dateLabel: "Date",
    preparation: "Si des instructions de préparation spécifiques s'appliquent, nous vous contacterons séparément.",
    questions: "Pour toute question, n'hésitez pas à nous contacter.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    subject: (s) => `Su cita de ${s} está confirmada`,
    greeting: "Estimado/a",
    confirmed: (s, d) => `Nos complace confirmar su cita para <strong>${s}</strong> el <strong>${d}</strong>.`,
    details: "Detalles de la cita",
    serviceLabel: "Servicio",
    dateLabel: "Fecha",
    preparation: "Si hay instrucciones de preparación especiales, nos pondremos en contacto con usted por separado.",
    questions: "Si tiene alguna pregunta, no dude en contactarnos.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    subject: (s) => `Il suo appuntamento per ${s} è confermato`,
    greeting: "Gentile",
    confirmed: (s, d) => `Siamo lieti di confermare il suo appuntamento per <strong>${s}</strong> il <strong>${d}</strong>.`,
    details: "Dettagli dell'appuntamento",
    serviceLabel: "Servizio",
    dateLabel: "Data",
    preparation: "Se sono previste istruzioni di preparazione particolari, la contatteremo separatamente.",
    questions: "Per qualsiasi domanda, non esiti a contattarci.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    subject: (s) => `A sua consulta de ${s} está confirmada`,
    greeting: "Caro/a",
    confirmed: (s, d) => `Temos o prazer de confirmar a sua consulta de <strong>${s}</strong> em <strong>${d}</strong>.`,
    details: "Detalhes da consulta",
    serviceLabel: "Serviço",
    dateLabel: "Data",
    preparation: "Se houver instruções de preparação especiais, entraremos em contacto consigo separadamente.",
    questions: "Se tiver alguma dúvida, não hesite em contactar-nos.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

export function treatmentConfirmationEmail(
  data: { firstName: string; lastName: string; serviceName: string; scheduledDate: string },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = treatmentConfirmationTranslations[language] ?? treatmentConfirmationTranslations["en"];
  const subject = t.subject(data.serviceName);

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${subject}</h1>
      <p>${t.greeting} ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)},</p>
      <p>${t.confirmed(escapeHtml(data.serviceName), escapeHtml(data.scheduledDate))}</p>
      <div class="highlight">
        <p style="margin:0 0 4px;font-weight:600;">${t.details}</p>
        <p style="margin:0;">${t.serviceLabel}: ${escapeHtml(data.serviceName)}</p>
        <p style="margin:0;">${t.dateLabel}: ${escapeHtml(data.scheduledDate)}</p>
      </div>
      <p>${t.preparation}</p>
      <p>${t.questions}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const text = `${t.greeting} ${data.firstName} ${data.lastName},

${t.confirmed(data.serviceName, data.scheduledDate).replace(/<\/?strong>/g, "")}

${t.serviceLabel}: ${data.serviceName}
${t.dateLabel}: ${data.scheduledDate}

${t.preparation}

${t.questions}

${t.signOff}
${t.team}`;

  return { subject, html, text };
}

// ─── Treatment Reminder ─────────────────────────────────────────────

const treatmentReminderTranslations: Record<string, {
  subject: (serviceName: string) => string;
  greeting: string;
  reminder: (serviceName: string, date: string) => string;
  lookingForward: string;
  questions: string;
  signOff: string;
  team: string;
  footer: string;
}> = {
  en: {
    subject: (s) => `Reminder: ${s} tomorrow`,
    greeting: "Dear",
    reminder: (s, d) => `This is a friendly reminder that your <strong>${s}</strong> appointment is scheduled for tomorrow, <strong>${d}</strong>.`,
    lookingForward: "We look forward to seeing you!",
    questions: "If you need to reschedule, please contact us as soon as possible.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    subject: (s) => `Erinnerung: ${s} morgen`,
    greeting: "Sehr geehrte/r",
    reminder: (s, d) => `Wir möchten Sie freundlich daran erinnern, dass Ihr <strong>${s}</strong>-Termin für morgen, <strong>${d}</strong>, geplant ist.`,
    lookingForward: "Wir freuen uns auf Ihren Besuch!",
    questions: "Sollten Sie den Termin verschieben müssen, kontaktieren Sie uns bitte so bald wie möglich.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    subject: (s) => `Herinnering: ${s} morgen`,
    greeting: "Geachte",
    reminder: (s, d) => `Dit is een vriendelijke herinnering dat uw afspraak voor <strong>${s}</strong> morgen gepland staat, op <strong>${d}</strong>.`,
    lookingForward: "Wij kijken ernaar uit u te zien!",
    questions: "Als u de afspraak moet verzetten, neem dan zo snel mogelijk contact met ons op.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    subject: (s) => `Rappel : ${s} demain`,
    greeting: "Cher/Chère",
    reminder: (s, d) => `Nous vous rappelons que votre rendez-vous pour <strong>${s}</strong> est prévu demain, le <strong>${d}</strong>.`,
    lookingForward: "Nous avons hâte de vous accueillir !",
    questions: "Si vous devez reporter votre rendez-vous, veuillez nous contacter dès que possible.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    subject: (s) => `Recordatorio: ${s} mañana`,
    greeting: "Estimado/a",
    reminder: (s, d) => `Le recordamos amablemente que su cita de <strong>${s}</strong> está programada para mañana, <strong>${d}</strong>.`,
    lookingForward: "¡Esperamos verle!",
    questions: "Si necesita reprogramar, por favor contacte con nosotros lo antes posible.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    subject: (s) => `Promemoria: ${s} domani`,
    greeting: "Gentile",
    reminder: (s, d) => `Le ricordiamo gentilmente che il suo appuntamento per <strong>${s}</strong> è previsto per domani, <strong>${d}</strong>.`,
    lookingForward: "Non vediamo l'ora di accoglierla!",
    questions: "Se ha necessità di riprogrammare, la preghiamo di contattarci il prima possibile.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    subject: (s) => `Lembrete: ${s} amanhã`,
    greeting: "Caro/a",
    reminder: (s, d) => `Gostaríamos de lhe lembrar que a sua consulta de <strong>${s}</strong> está agendada para amanhã, <strong>${d}</strong>.`,
    lookingForward: "Esperamos vê-lo/a!",
    questions: "Se precisar de reagendar, por favor contacte-nos o mais rapidamente possível.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

export function treatmentReminderEmail(
  data: { firstName: string; lastName: string; serviceName: string; scheduledDate: string },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = treatmentReminderTranslations[language] ?? treatmentReminderTranslations["en"];
  const subject = t.subject(data.serviceName);

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${subject}</h1>
      <p>${t.greeting} ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)},</p>
      <p>${t.reminder(escapeHtml(data.serviceName), escapeHtml(data.scheduledDate))}</p>
      <p>${t.lookingForward}</p>
      <p>${t.questions}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const text = `${t.greeting} ${data.firstName} ${data.lastName},

${t.reminder(data.serviceName, data.scheduledDate).replace(/<\/?strong>/g, "")}

${t.lookingForward}

${t.questions}

${t.signOff}
${t.team}`;

  return { subject, html, text };
}

// ─── Treatment Completed ────────────────────────────────────────────

const treatmentCompletedTranslations: Record<string, {
  subject: (serviceName: string) => string;
  greeting: string;
  completed: (serviceName: string, date: string) => string;
  notesLabel: string;
  followUp: string;
  questions: string;
  signOff: string;
  team: string;
  footer: string;
}> = {
  en: {
    subject: (s) => `Your ${s} treatment is complete`,
    greeting: "Dear",
    completed: (s, d) => `Your <strong>${s}</strong> treatment on <strong>${d}</strong> has been completed successfully.`,
    notesLabel: "Treatment notes:",
    followUp: "We will follow up with you in 7 days to see how you are doing.",
    questions: "If you have any questions in the meantime, please don't hesitate to contact us.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    subject: (s) => `Ihre ${s}-Behandlung ist abgeschlossen`,
    greeting: "Sehr geehrte/r",
    completed: (s, d) => `Ihre <strong>${s}</strong>-Behandlung am <strong>${d}</strong> wurde erfolgreich abgeschlossen.`,
    notesLabel: "Behandlungshinweise:",
    followUp: "Wir werden uns in 7 Tagen bei Ihnen melden, um zu sehen, wie es Ihnen geht.",
    questions: "Falls Sie in der Zwischenzeit Fragen haben, stehen wir Ihnen jederzeit zur Verfügung.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    subject: (s) => `Uw ${s}-behandeling is afgerond`,
    greeting: "Geachte",
    completed: (s, d) => `Uw <strong>${s}</strong>-behandeling op <strong>${d}</strong> is succesvol afgerond.`,
    notesLabel: "Behandelnotities:",
    followUp: "Wij nemen over 7 dagen contact met u op om te vragen hoe het met u gaat.",
    questions: "Heeft u in de tussentijd vragen? Neem gerust contact met ons op.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    subject: (s) => `Votre traitement ${s} est terminé`,
    greeting: "Cher/Chère",
    completed: (s, d) => `Votre traitement <strong>${s}</strong> du <strong>${d}</strong> a été réalisé avec succès.`,
    notesLabel: "Notes de traitement :",
    followUp: "Nous prendrons de vos nouvelles dans 7 jours pour voir comment vous allez.",
    questions: "Si vous avez des questions entretemps, n'hésitez pas à nous contacter.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    subject: (s) => `Su tratamiento de ${s} ha finalizado`,
    greeting: "Estimado/a",
    completed: (s, d) => `Su tratamiento de <strong>${s}</strong> del <strong>${d}</strong> se ha completado con éxito.`,
    notesLabel: "Notas del tratamiento:",
    followUp: "Nos pondremos en contacto con usted en 7 días para ver cómo se encuentra.",
    questions: "Si tiene alguna pregunta mientras tanto, no dude en contactarnos.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    subject: (s) => `Il suo trattamento ${s} è completato`,
    greeting: "Gentile",
    completed: (s, d) => `Il suo trattamento <strong>${s}</strong> del <strong>${d}</strong> è stato completato con successo.`,
    notesLabel: "Note sul trattamento:",
    followUp: "La contatteremo tra 7 giorni per sapere come sta.",
    questions: "Se nel frattempo ha domande, non esiti a contattarci.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    subject: (s) => `O seu tratamento de ${s} está concluído`,
    greeting: "Caro/a",
    completed: (s, d) => `O seu tratamento de <strong>${s}</strong> em <strong>${d}</strong> foi concluído com sucesso.`,
    notesLabel: "Notas do tratamento:",
    followUp: "Entraremos em contacto consigo dentro de 7 dias para saber como se sente.",
    questions: "Se tiver alguma dúvida entretanto, não hesite em contactar-nos.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

export function treatmentCompletedEmail(
  data: { firstName: string; lastName: string; serviceName: string; completedDate: string; notes?: string },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = treatmentCompletedTranslations[language] ?? treatmentCompletedTranslations["en"];
  const subject = t.subject(data.serviceName);

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${subject}</h1>
      <p>${t.greeting} ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)},</p>
      <p>${t.completed(escapeHtml(data.serviceName), escapeHtml(data.completedDate))}</p>
      ${data.notes ? `<div class="highlight"><p style="margin:0;"><strong>${t.notesLabel}</strong> ${escapeHtml(data.notes)}</p></div>` : ""}
      <p>${t.followUp}</p>
      <p>${t.questions}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const text = `${t.greeting} ${data.firstName} ${data.lastName},

${t.completed(data.serviceName, data.completedDate).replace(/<\/?strong>/g, "")}
${data.notes ? `\n${t.notesLabel} ${data.notes}` : ""}

${t.followUp}

${t.questions}

${t.signOff}
${t.team}`;

  return { subject, html, text };
}

// ─── Follow-Up ──────────────────────────────────────────────────────

const followUpTranslations: Record<string, {
  subject: (serviceName: string) => string;
  greeting: string;
  intro: (serviceName: string) => string;
  howAreYou: string;
  replyNote: string;
  signOff: string;
  team: string;
  footer: string;
}> = {
  en: {
    subject: (s) => `How are you feeling after your ${s}?`,
    greeting: "Dear",
    intro: (s) => `It has been a week since your <strong>${s}</strong> treatment, and we wanted to check in on you.`,
    howAreYou: "How are you feeling? We would love to hear about your experience and any changes you have noticed.",
    replyNote: "Feel free to simply reply to this email — we read every response personally.",
    signOff: "Warm regards,",
    team: "Your Celljevity Team",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    subject: (s) => `Wie fühlen Sie sich nach Ihrer ${s}-Behandlung?`,
    greeting: "Sehr geehrte/r",
    intro: (s) => `Es ist eine Woche seit Ihrer <strong>${s}</strong>-Behandlung vergangen, und wir möchten uns nach Ihrem Befinden erkundigen.`,
    howAreYou: "Wie geht es Ihnen? Wir würden uns freuen, von Ihren Erfahrungen und etwaigen Veränderungen zu hören.",
    replyNote: "Antworten Sie einfach auf diese E-Mail — wir lesen jede Antwort persönlich.",
    signOff: "Herzliche Grüße,",
    team: "Ihr Celljevity Team",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    subject: (s) => `Hoe voelt u zich na uw ${s}?`,
    greeting: "Geachte",
    intro: (s) => `Het is een week geleden sinds uw <strong>${s}</strong>-behandeling, en wij wilden even bij u informeren.`,
    howAreYou: "Hoe voelt u zich? Wij horen graag over uw ervaring en eventuele veranderingen die u heeft opgemerkt.",
    replyNote: "U kunt gewoon op deze e-mail antwoorden — wij lezen elke reactie persoonlijk.",
    signOff: "Hartelijke groet,",
    team: "Uw Celljevity Team",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    subject: (s) => `Comment vous sentez-vous après votre ${s} ?`,
    greeting: "Cher/Chère",
    intro: (s) => `Cela fait une semaine depuis votre traitement <strong>${s}</strong>, et nous souhaitions prendre de vos nouvelles.`,
    howAreYou: "Comment vous sentez-vous ? Nous serions ravis d'en savoir plus sur votre expérience et les éventuels changements que vous avez constatés.",
    replyNote: "N'hésitez pas à répondre directement à cet e-mail — nous lisons chaque réponse personnellement.",
    signOff: "Chaleureusement,",
    team: "Votre équipe Celljevity",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    subject: (s) => `¿Cómo se siente después de su ${s}?`,
    greeting: "Estimado/a",
    intro: (s) => `Ha pasado una semana desde su tratamiento de <strong>${s}</strong> y queríamos saber cómo se encuentra.`,
    howAreYou: "¿Cómo se siente? Nos encantaría conocer su experiencia y cualquier cambio que haya notado.",
    replyNote: "No dude en responder directamente a este correo — leemos cada respuesta personalmente.",
    signOff: "Un cordial saludo,",
    team: "Su equipo Celljevity",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    subject: (s) => `Come si sente dopo il suo ${s}?`,
    greeting: "Gentile",
    intro: (s) => `È passata una settimana dal suo trattamento <strong>${s}</strong> e volevamo sapere come sta.`,
    howAreYou: "Come si sente? Ci farebbe piacere conoscere la sua esperienza e qualsiasi cambiamento abbia notato.",
    replyNote: "Può semplicemente rispondere a questa e-mail — leggiamo ogni risposta personalmente.",
    signOff: "Cordialmente,",
    team: "Il suo team Celljevity",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    subject: (s) => `Como se sente após o seu ${s}?`,
    greeting: "Caro/a",
    intro: (s) => `Passou uma semana desde o seu tratamento de <strong>${s}</strong> e gostaríamos de saber como se sente.`,
    howAreYou: "Como está? Gostaríamos muito de ouvir sobre a sua experiência e quaisquer mudanças que tenha notado.",
    replyNote: "Sinta-se à vontade para responder diretamente a este e-mail — lemos cada resposta pessoalmente.",
    signOff: "Com carinho,",
    team: "A sua equipa Celljevity",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

export function followUpEmail(
  data: { firstName: string; lastName: string; serviceName: string },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = followUpTranslations[language] ?? followUpTranslations["en"];
  const subject = t.subject(data.serviceName);

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${subject}</h1>
      <p>${t.greeting} ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)},</p>
      <p>${t.intro(escapeHtml(data.serviceName))}</p>
      <p>${t.howAreYou}</p>
      <p style="font-size:13px;color:#9ca3af;">${t.replyNote}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const text = `${t.greeting} ${data.firstName} ${data.lastName},

${t.intro(data.serviceName).replace(/<\/?strong>/g, "")}

${t.howAreYou}

${t.replyNote}

${t.signOff}
${t.team}`;

  return { subject, html, text };
}

// ─── Quote Accepted ─────────────────────────────────────────────────

const quoteAcceptedTranslations: Record<string, {
  subject: (quoteNumber: string) => string;
  greeting: string;
  accepted: (quoteNumber: string, total: string) => string;
  nextSteps: string;
  nextStepsDetail: string;
  questions: string;
  signOff: string;
  team: string;
  footer: string;
}> = {
  en: {
    subject: (q) => `Quote ${q} accepted — thank you!`,
    greeting: "Dear",
    accepted: (q, total) => `Your quote <strong>#${q}</strong> with a total of <strong>${total}</strong> has been accepted.`,
    nextSteps: "Next steps",
    nextStepsDetail: "Our team will be in touch shortly to schedule your services and arrange any necessary preparations.",
    questions: "If you have any questions, please don't hesitate to contact us.",
    signOff: "Kind regards,",
    team: "Your Celljevity Team",
    footer: "Celljevity Longevity OS — Your health, our priority",
  },
  de: {
    subject: (q) => `Angebot ${q} angenommen — vielen Dank!`,
    greeting: "Sehr geehrte/r",
    accepted: (q, total) => `Ihr Angebot <strong>#${q}</strong> über <strong>${total}</strong> wurde angenommen.`,
    nextSteps: "Nächste Schritte",
    nextStepsDetail: "Unser Team wird sich in Kürze bei Ihnen melden, um Ihre Termine zu vereinbaren und alle notwendigen Vorbereitungen zu treffen.",
    questions: "Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.",
    signOff: "Mit freundlichen Grüßen,",
    team: "Ihr Celljevity Team",
    footer: "Celljevity Longevity OS — Ihre Gesundheit, unsere Priorität",
  },
  nl: {
    subject: (q) => `Offerte ${q} geaccepteerd — dank u!`,
    greeting: "Geachte",
    accepted: (q, total) => `Uw offerte <strong>#${q}</strong> ter waarde van <strong>${total}</strong> is geaccepteerd.`,
    nextSteps: "Volgende stappen",
    nextStepsDetail: "Ons team neemt binnenkort contact met u op om uw diensten in te plannen en de nodige voorbereidingen te treffen.",
    questions: "Heeft u vragen? Neem gerust contact met ons op.",
    signOff: "Met vriendelijke groet,",
    team: "Uw Celljevity Team",
    footer: "Celljevity Longevity OS — Uw gezondheid, onze prioriteit",
  },
  fr: {
    subject: (q) => `Devis ${q} accepté — merci !`,
    greeting: "Cher/Chère",
    accepted: (q, total) => `Votre devis <strong>#${q}</strong> d'un montant de <strong>${total}</strong> a été accepté.`,
    nextSteps: "Prochaines étapes",
    nextStepsDetail: "Notre équipe vous contactera prochainement pour planifier vos services et organiser les préparations nécessaires.",
    questions: "Pour toute question, n'hésitez pas à nous contacter.",
    signOff: "Cordialement,",
    team: "Votre équipe Celljevity",
    footer: "Celljevity Longevity OS — Votre santé, notre priorité",
  },
  es: {
    subject: (q) => `Presupuesto ${q} aceptado — ¡gracias!`,
    greeting: "Estimado/a",
    accepted: (q, total) => `Su presupuesto <strong>#${q}</strong> por un total de <strong>${total}</strong> ha sido aceptado.`,
    nextSteps: "Próximos pasos",
    nextStepsDetail: "Nuestro equipo se pondrá en contacto con usted en breve para programar sus servicios y organizar los preparativos necesarios.",
    questions: "Si tiene alguna pregunta, no dude en contactarnos.",
    signOff: "Atentamente,",
    team: "Su equipo Celljevity",
    footer: "Celljevity Longevity OS — Su salud, nuestra prioridad",
  },
  it: {
    subject: (q) => `Preventivo ${q} accettato — grazie!`,
    greeting: "Gentile",
    accepted: (q, total) => `Il suo preventivo <strong>#${q}</strong> per un totale di <strong>${total}</strong> è stato accettato.`,
    nextSteps: "Prossimi passi",
    nextStepsDetail: "Il nostro team la contatterà a breve per programmare i suoi servizi e organizzare i preparativi necessari.",
    questions: "Per qualsiasi domanda, non esiti a contattarci.",
    signOff: "Cordiali saluti,",
    team: "Il suo team Celljevity",
    footer: "Celljevity Longevity OS — La sua salute, la nostra priorità",
  },
  pt: {
    subject: (q) => `Orçamento ${q} aceite — obrigado!`,
    greeting: "Caro/a",
    accepted: (q, total) => `O seu orçamento <strong>#${q}</strong> no valor de <strong>${total}</strong> foi aceite.`,
    nextSteps: "Próximos passos",
    nextStepsDetail: "A nossa equipa entrará em contacto consigo brevemente para agendar os seus serviços e organizar os preparativos necessários.",
    questions: "Se tiver alguma dúvida, não hesite em contactar-nos.",
    signOff: "Com os melhores cumprimentos,",
    team: "A sua equipa Celljevity",
    footer: "Celljevity Longevity OS — A sua saúde, a nossa prioridade",
  },
};

export function quoteAcceptedEmail(
  data: { customerName: string; quoteNumber: string; total: number },
  language = "en",
): { subject: string; html: string; text: string } {
  const t = quoteAcceptedTranslations[language] ?? quoteAcceptedTranslations["en"];
  const subject = t.subject(data.quoteNumber);

  const locale = currencyLocale[language] ?? "en-DE";
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(n);
  const formattedTotal = formatCurrency(data.total);

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${subject}</h1>
      <p>${t.greeting} ${escapeHtml(data.customerName)},</p>
      <p>${t.accepted(escapeHtml(data.quoteNumber), formattedTotal)}</p>
      <div class="highlight">
        <p style="margin:0;font-weight:600;">${t.nextSteps}</p>
        <p style="margin:8px 0 0;">${t.nextStepsDetail}</p>
      </div>
      <p>${t.questions}</p>
      <p style="margin-top:24px;">${t.signOff}<br><strong>${t.team}</strong></p>
    </div>
    <div class="footer">${t.footer}</div>
  `);

  const text = `${t.greeting} ${data.customerName},

${t.accepted(data.quoteNumber, formattedTotal).replace(/<\/?strong>/g, "")}

${t.nextSteps}
${t.nextStepsDetail}

${t.questions}

${t.signOff}
${t.team}`;

  return { subject, html, text };
}
