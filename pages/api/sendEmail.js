import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = 'accoglienza@itiangioy.org';

// Log iniziale più dettagliato
console.log('\n=== SENDGRID INITIALIZATION ===');
console.log({
  nodeEnv: process.env.NODE_ENV,
  apiKeyExists: !!apiKey,
  apiKeyLength: apiKey?.length || 0,
  apiKeyFormat: apiKey?.startsWith('SG.') ? 'Valid' : 'Invalid',
  senderEmail: SENDER_EMAIL
});

// Controllo più rigoroso dell'API key
if (!apiKey) {
  throw new Error('SENDGRID_API_KEY mancante nelle variabili d\'ambiente');
}

if (!apiKey.startsWith('SG.')) {
  throw new Error('SENDGRID_API_KEY non valida - deve iniziare con SG.');
}

sgMail.setApiKey(apiKey);

export default async function handler(req, res) {
  console.log('\n=== INIZIO GESTIONE RICHIESTA SENDGRID ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // Verifica API key all'inizio di ogni richiesta
  console.log('\n=== VERIFICA SENDGRID API KEY ===');
  console.log('API Key status:', {
    exists: !!apiKey,
    length: apiKey?.length,
    format: apiKey?.startsWith('SG.') ? 'valid' : 'invalid',
    preview: apiKey?.substring(0, 5) + '...'
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Metodo ${req.method} non consentito.` });
  }

  const { to, cc, subject, message, attachment } = req.body;

  console.log('API dati ricevuti:', {
    to,
    cc,
    subject,
    messageLength: message?.length,
    hasAttachment: !!attachment
  });

  // Log separati per ogni campo
  console.log('Destinatario principale (to):', to || 'MANCANTE');
  console.log('Destinatari in copia (cc):', cc || 'MANCANTE');
  console.log('Oggetto della mail (subject):', subject || 'MANCANTE');
  console.log('Contenuto del messaggio (message):', message || 'MANCANTE');
  console.log('Allegato presente:', !!attachment);

  // Validazione input
  if (!to || !subject || !message) {
    console.error('API errore - Dati mancanti:', {
      to: to || 'MANCANTE',
      cc: cc || 'MANCANTE',
      subject: subject || 'MANCANTE',
      messagePresent: !!message,
    });
    return res.status(400).json({
      success: false,
      error: 'Dati mancanti per l\'invio dell\'email'
    });
  }

  try {
    console.log('\n=== PREPARAZIONE EMAIL ===');
    const msg = {
      to: to.split(','),
      from: SENDER_EMAIL,
      cc: cc ? cc.split(',') : undefined,
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
      attachments: attachment ? [{
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.type,
        disposition: 'attachment'
      }] : []
    };
    console.log('Configurazione email:', {
      to: msg.to,
      from: msg.from,
      cc: msg.cc,
      subject: msg.subject,
      hasAttachment: !!msg.attachments?.length
    });

    console.log('\n=== INVIO EMAIL SENDGRID ===');
    const [response] = await sgMail.send(msg);
    console.log('Risposta SendGrid:', {
      statusCode: response?.statusCode,
      headers: response?.headers,
      body: response?.body
    });

    return res.status(200).json({
      success: true,
      message: 'Email inviata con successo!'
    });

  } catch (error) {
    console.error('\n=== ERRORE SENDGRID DETTAGLIATO ===');
    console.error('Tipo errore:', error.constructor.name);
    console.error('Messaggio:', error.message);
    console.error('Codice:', error.code);
    console.error('Stack:', error.stack);
    if (error.response) {
      console.error('Risposta SendGrid:', {
        body: error.response.body,
        headers: error.response.headers,
        status: error.response.status
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Errore durante l\'invio dell\'email.',
      details: {
        message: error.message,
        code: error.code,
        response: error.response?.body
      }
    });
  }
}