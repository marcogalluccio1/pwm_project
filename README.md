# FastFood

FastFood è una web application full-stack per la gestione di ordini online per ristoranti.
L’applicazione consente la registrazione e l’autenticazione degli utenti, la gestione dei ristoranti
e dei menu, e il processo di ordinazione dei piatti da parte dei clienti, con due ruoli distinti
(cliente e ristoratore).

Il progetto è sviluppato come Single Page Application (SPA) con frontend in React
e backend in Node.js, seguendo un’architettura REST.

---

## Tecnologie utilizzate

- **Frontend**: React, Vite, JavaScript, CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Autenticazione**: JWT
- **API**: REST

---

## Funzionalità principali

- Registrazione e login utenti
- Gestione profilo utente
- Gestione ristorante e menu (ristoratore)
- Visualizzazione ristoranti e piatti
- Creazione e gestione ordini
- Aggiornamento stato degli ordini
- Interfacce differenziate per cliente e ristoratore

---

## Prerequisiti

- Node.js
- MongoDB (locale o MongoDB Atlas)

---

## Configurazione

All’interno della cartella `backend` è presente un file `.env.example`.

Creare un file `.env` partendo da `.env.example` e configurare le variabili richieste
(ad esempio la connessione a MongoDB e la chiave JWT).

---

## Avvio dell’applicazione

### Installazione dipendenze

```bash
npm install
```

Se necessario, ripetere l’installazione anche nelle cartelle `frontend` e `backend`.

---

### Build del frontend

Dalla root del progetto:

```bash
npm run build
```

---

### Avvio del server

Dalla root del progetto:

```bash
npm start
```

L’applicazione sarà disponibile all’indirizzo:

`http://localhost:3000`

Il backend espone le API REST e serve anche il frontend compilato.