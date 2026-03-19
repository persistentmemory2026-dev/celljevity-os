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
      <h1>${t.greeting}, ${patient.firstName} ${patient.lastName}!</h1>
      <p>${t.intro}</p>
      <div class="highlight">
        <p style="margin:0 0 8px;font-weight:600;">${t.emailLabel}</p>
        <p class="inbox-address" style="margin:0;">${patient.agentmailAddress}</p>
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
      <p>${t.greeting} ${quote.customerName},</p>
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
  const subject = t.subject(fullName);

  const html = wrap(`
    <div class="card">
      <div class="header"><div class="logo">Celljevity</div></div>
      <h1>${t.heading}</h1>
      <p>${t.body(patient.attachmentCount, patient.senderEmail, fullName)}</p>
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
      <h1>${t.greeting}, ${patient.firstName} ${patient.lastName}!</h1>
      <p>${t.intro}</p>
      <div class="highlight" style="text-align:center;">
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 32px;background:#78e0ad;color:#1a1a2e;font-weight:700;text-decoration:none;border-radius:8px;font-size:16px;">${t.buttonLabel}</a>
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
