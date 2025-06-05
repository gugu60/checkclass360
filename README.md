# CheckClass360

Sistema di prenotazione aule per l'Istituto Tecnico Industriale "G. M. Angioy" di Sassari.

## Funzionalità

- 📅 Calendario interattivo delle prenotazioni
- 🏫 Gestione prenotazioni aule
- 👥 Sistema di autenticazione per docenti e amministratori
- 📊 Riepilogo prenotazioni per aula
- 🔒 Gestione permessi (i docenti possono cancellare solo le proprie prenotazioni)

## Tecnologie Utilizzate

- Next.js
- React
- Tailwind CSS
- Supabase (Database)

## Requisiti

- Node.js 14.x o superiore
- npm o yarn

## Installazione

1. Clona il repository:
```bash
git clone https://github.com/tuousername/checkclass360.git
cd checkclass360
```

2. Installa le dipendenze:
```bash
npm install
# oppure
yarn install
```

3. Crea un file `.env.local` nella root del progetto con le seguenti variabili:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_key
```

4. Avvia il server di sviluppo:
```bash
npm run dev
# oppure
yarn dev
```

5. Apri [http://localhost:3000](http://localhost:3000) nel browser

## Credenziali di Accesso

### Amministratori
- Username: `admin`, Password: `admin`
- Username: `usai`, Password: `usai123`

### Docenti
- Username: `roggio`, Password: `roggio123`
- Username: `palma`, Password: `palma123`
- Username: `multazzu`, Password: `multazzu123`
- Username: `gianino`, Password: `gianino123`
- Username: `cherchi`, Password: `cherchi123`

## Struttura del Progetto

```
checkclass360/
├── components/         # Componenti React
├── config/            # File di configurazione
├── pages/             # Pagine Next.js
├── public/            # File statici
├── styles/            # File CSS
├── .env.local         # Variabili d'ambiente (da creare)
├── .gitignore         # File da ignorare in git
├── package.json       # Dipendenze e script
└── README.md          # Documentazione
```

## Licenza

Questo progetto è riservato all'uso interno dell'Istituto Tecnico Industriale "G. M. Angioy" di Sassari.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# gestioneingressi" 
