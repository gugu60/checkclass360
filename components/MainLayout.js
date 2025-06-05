/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback } from 'react';
import ButtonsLayout from './ButtonsLayout';
import Swal from 'sweetalert2';
import { createClient } from '@supabase/supabase-js';
import { pdf } from '@react-pdf/renderer';
import GeneratePDFDocument from './GeneratePDFDocument';
import { HiOutlineTrash } from "react-icons/hi";
import { HiOutlinePencil } from "react-icons/hi";
import { HiOutlineClock } from "react-icons/hi";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { HiOutlineDocumentCheck } from 'react-icons/hi2';
import { HiOutlineMail } from "react-icons/hi";
import dynamic from 'next/dynamic';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { HiBarsArrowUp } from "react-icons/hi2";
import Image from 'next/image';
import AulePrenotazione from './AulePrenotazione';
/* eslint-disable @typescript-eslint/no-unused-vars */


// Modifica la definizione di API_URL
// const API_URL = process.env.NODE_ENV === 'development' 
//   ? '' // URL vuoto per usare il path relativo
//   : 'https://gestioneingressi-4v65ymg2l-profisicagu-gmailcoms-projects.vercel.app';

// Configurazione di Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MainLayout = () => {
  const [alunni, setAlunni] = useState([]);
  const [selectedAlunnoId, setSelectedAlunnoId] = useState(null);
  const [selectedAlunno, setSelectedAlunno] = useState(null);
  const [genitori, setGenitori] = useState([]);
  const [coordinatore, setCoordinatore] = useState(null);
  const [ritardi, setRitardi] = useState([]);
  const [ritardiState, setRitardiState] = useState([]);
  const [error, setError] = useState(null);
  const Select = dynamic(() => import('react-select'), { ssr: false });
  const [alunniConRitardi, setAlunniConRitardi] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [aule, setAule] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showPrenotazioneForm, setShowPrenotazioneForm] = useState(false);
  const [showRiepilogoModal, setShowRiepilogoModal] = useState(false);

  //const formatDateForUI = (date) => date.split('-').reverse().join('.'); // Da "2024-12-15" a "15.12.2024"
 
  
  //const formatTimeForUI = (time) => time.slice(0, 5); // Da "11:50:34" a "11:50"

 /* eslint-disable @typescript-eslint/no-unused-vars */


  
  const [ritardiOdierni, setRitardiOdierni] = useState([]); // Stato separato per ritardi odierni

  // Funzione per recuperare tutti gli alunni
  const fetchAlunni = async () => {
    const { data, error } = await supabase.from('alunni').select('*'); // Assicurati di avere la tabella corretta
    if (error) {
      console.error("Errore nel recupero degli alunni:", error);
      return;
    }
    setAlunni(data);
  };
// Carica tutti gli alunni all'avvio del componente
useEffect(() => {
  fetchAlunni();
}, []);


useEffect(() => {
  fetchAlunniConRitardi();
}, []);


const fetchAlunniConRitardi = async () => {
  try {
    // Passo 1: Trova gli alunni con almeno un ritardo "P*"
    const { data: alunniConPStar, error: errorPStar } = await supabase
      .from("ritardi")
      .select("id_alunno")
      .eq("motivazione", "P*");

    if (errorPStar) throw errorPStar;

    // Ottieni gli ID unici degli alunni con almeno un "P*"
    const idAlunniConPStar = [...new Set(alunniConPStar.map((ritardo) => ritardo.id_alunno))];

    if (idAlunniConPStar.length === 0) {
      setAlunniConRitardi([]); // Nessun alunno con "P*"
      return;
    }

    // Passo 2: Trova gli alunni che hanno almeno una bustina verde (emailinviata = true)
    const { data: alunniConBustina, error: errorBustina } = await supabase
      .from("ritardi")
      .select("id_alunno")
      .eq("emailinviata", true);

    if (errorBustina) throw errorBustina;

    // Ottieni gli ID unici degli alunni con bustina verde
    const idAlunniConBustina = new Set(alunniConBustina.map((ritardo) => ritardo.id_alunno));

    // Passo 3: Filtra gli alunni che hanno "P*" ma NON hanno bustina verde
    const idAlunniFinale = idAlunniConPStar.filter((id) => !idAlunniConBustina.has(id));

    if (idAlunniFinale.length === 0) {
      setAlunniConRitardi([]); // Nessun alunno da mostrare
      return;
    }

    // Passo 4: Recupera i dettagli degli alunni filtrati
    const { data: alunniFinali, error: errorFinale } = await supabase
      .from("alunni")
      .select("id_alunno, cognome, nome, id_classe, classi(nome_classe)")
      .in("id_alunno", idAlunniFinale)
      .order("cognome", { ascending: true });

    if (errorFinale) throw errorFinale;

    // Mappa gli alunni con il formato corretto per il dropdown
    const uniqueAlunni = alunniFinali.map((alunno) => ({
      id_alunno: alunno.id_alunno,
      nominativo: `${alunno.cognome} ${alunno.nome}`.trim(),
      classe: alunno.classi?.nome_classe || "N/D",
    }));

    setAlunniConRitardi(uniqueAlunni); // Aggiorna lo stato con gli alunni filtrati
  } catch (error) {
    console.error("Errore nel recupero degli alunni con ritardi P* senza bustina:", error.message);
  }
};



  // Funzione per gestire i ritardi senza stampa
  const handleButtonClick = async (motivazione) => {
    if (!isStudentNameValid()) return;

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split("T")[0];
    const formattedTime = currentDate.toTimeString().split(" ")[0];

    // Ottieni tutti i ritardi combinati
    const combinedRitardi = getCombinedRitardi();

    // Conta il numero di ritardi con motivazione "P"
    const countPersonale = combinedRitardi.filter(
      (ritardo) => ritardo.motivazione === "P"
    ).length;

    // Se ci sono già 3 "P", modifica la motivazione in "P*"
    if (motivazione === "P" && countPersonale >= 3) {
      motivazione = "P*";
    }

    const newRitardo = {
      id_alunno: selectedAlunno?.id_alunno,
      data: formattedDate,
      orario_ingresso: formattedTime,
      motivazione,
    };

    // Inserimento nel database
    const { error } = await supabase.from("ritardi").insert([newRitardo]);

    if (error) {
      console.error(" Errore durante l'inserimento:", error.message);
      Swal.fire("Errore", "Impossibile inserire il ritardo.", "error");
      return;
    }

    // Ricarica tutti i ritardi per forzare l'aggiornamento
    await fetchDatiAlunno(); // Questa funzione deve recuperare tutti i dati dell'alunno corrente
    Swal.fire(
      "Successo",
      `Ritardo inserito con motivazione "${motivazione}"`,
      "success"
    );
  };
  

  {/*
 // Funzione per gestire i ritardi con stampa. FUNZIONA MA NELLA STAMPA SONO POSSIBILI DEI MIGLIORAMENTI
  const handleButtonWithPrintDialog = async (motivazione) => {
    if (!isStudentNameValid()) return;
  
    try {
      // Ottieni data e ora correnti
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];
      const formattedTime = currentDate.toTimeString().split(" ")[0];
  
      // Conta i ritardi con motivazione "P"
      const combinedRitardi = getCombinedRitardi();
      const countPersonale = combinedRitardi.filter(
        (ritardo) => ritardo.motivazione === "P"
      ).length;
  
      // Aggiorna la motivazione se necessario
      if (motivazione === "P" && countPersonale >= 3) {
        motivazione = "P*";
      }
  
      // Inserisci il nuovo ritardo nel database
      const newRitardo = {
        id_alunno: selectedAlunno?.id_alunno,
        data: formattedDate,
        orario_ingresso: formattedTime,
        motivazione,
      };
  
      const { error } = await supabase.from("ritardi").insert([newRitardo]);
      if (error) {
        console.error("Errore durante l'inserimento del ritardo:", error.message);
        Swal.fire("Errore", "Impossibile inserire il ritardo.", "error");
        return;
      }
  
      // Aggiorna i dati dell'alunno nella UI
      await fetchDatiAlunno();
  
      // Recupera i ritardi aggiornati direttamente dal database
      const { data: updatedRitardi, error: fetchError } = await supabase
        .from("ritardi")
        .select("*")
        .eq("id_alunno", selectedAlunno?.id_alunno);
  
      if (fetchError) {
        console.error("Errore nel recupero dei ritardi aggiornati:", fetchError.message);
        Swal.fire("Errore", "Impossibile recuperare i dati aggiornati.", "error");
        return;
      }
  
      console.log("Ritardi aggiornati per il PDF:", updatedRitardi);
  
      // Genera il PDF con i ritardi aggiornati
      const studentDataForPDF = {
        ...selectedAlunno,
        ritardi: updatedRitardi,
      };
  
      // Genera il PDF come Blob
      const blob = await pdf(<GeneratePDFDocument student={studentDataForPDF} />).toBlob();
  
      // Crea un nome file nel formato "Cognome Nome [Classe].pdf"
      const fileName = `${selectedAlunno.cognome}_${selectedAlunno.nome} [${selectedAlunno.classe || "Senza Classe"}].pdf`;
  
      // Chiedi all'utente se desidera scaricare o stampare il PDF
      const { value: action } = await Swal.fire({
        title: "Cosa vuoi fare?",
        icon: "question",
        input: "radio",
        inputOptions: {
          download: "Scarica il PDF",
          print: "Stampa il PDF",
        },
        inputValidator: (value) => {
          if (!value) {
            return "Devi scegliere un'opzione!";
          }
        },
        showCancelButton: true,
        confirmButtonText: "Conferma",
        cancelButtonText: "Annulla",
      });
  
      if (!action) {
        Swal.fire("Operazione annullata", "Nessuna azione è stata eseguita.", "info");
        return;
      }
  
      if (action === "download") {
        // Scarica il PDF
        saveAs(blob, fileName);
        Swal.fire("Successo", "Il PDF è stato scaricato correttamente.", "success");
      } else if (action === "print") {
        // Stampa il PDF
        const pdfURL = URL.createObjectURL(blob);
        const printWindow = window.open(pdfURL, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
            printWindow.onafterprint = () => {
              printWindow.close();
              URL.revokeObjectURL(pdfURL); // Libera la memoria dell'URL
            };
          };
        } else {
          Swal.fire("Errore", "Impossibile aprire la finestra di stampa.", "error");
        }
      }
    } catch (error) {
      console.error("Errore generale:", error.message);
      Swal.fire("Errore", "Si è verificato un errore durante la generazione o la stampa del PDF.", "error");
    }
  };  
*/}




 // Funzione per gestire i ritardi con stampa. FUNZIONA !!!
  const handleButtonWithPrintDialog = async (motivazione) => {
    if (!isStudentNameValid()) return;
  
    try {
      // Ottieni data e ora correnti
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];
      const formattedTime = currentDate.toTimeString().split(" ")[0];
  
      // Conta i ritardi con motivazione "P"
      const combinedRitardi = getCombinedRitardi();
      const countPersonale = combinedRitardi.filter(
        (ritardo) => ritardo.motivazione === "P"
      ).length;
  
      // Aggiorna la motivazione se necessario
      if (motivazione === "P" && countPersonale >= 3) {
        motivazione = "P*";
      }
  
      // Inserisci il nuovo ritardo nel database
      const newRitardo = {
        id_alunno: selectedAlunno?.id_alunno,
        data: formattedDate,
        orario_ingresso: formattedTime,
        motivazione,
      };
  
      const { error } = await supabase.from("ritardi").insert([newRitardo]);
      if (error) {
        console.error("Errore durante l'inserimento del ritardo:", error.message);
        Swal.fire("Errore", "Impossibile inserire il ritardo.", "error");
        return;
      }
  
      // Aggiorna i dati dell'alunno nella UI
      await fetchDatiAlunno();
  
      // Recupera i ritardi aggiornati direttamente dal database
      const { data: updatedRitardi, error: fetchError } = await supabase
        .from("ritardi")
        .select("*")
        .eq("id_alunno", selectedAlunno?.id_alunno);
  
      if (fetchError) {
        console.error("Errore nel recupero dei ritardi aggiornati:", fetchError.message);
        Swal.fire("Errore", "Impossibile recuperare i dati aggiornati.", "error");
        return;
      }
  
      console.log("Ritardi aggiornati per il PDF:", updatedRitardi);
  
      // Genera il PDF con i ritardi aggiornati
      const studentDataForPDF = {
        ...selectedAlunno,
        ritardi: updatedRitardi,
      };
  
      // Genera il PDF come Blob
      const blob = await pdf(<GeneratePDFDocument student={studentDataForPDF} />).toBlob();
  
      // Crea un nome file nel formato "Cognome Nome [Classe].pdf"
      const fileName = `${selectedAlunno.cognome}_${selectedAlunno.nome} [${selectedAlunno.classe || "Senza Classe"}].pdf`;
  
      // Chiedi all'utente se desidera scaricare o stampare il PDF
      const { value: action } = await Swal.fire({
        title: "Cosa vuoi fare?",
        icon: "question",
        input: "radio",
        inputOptions: {
          download: "Scarica il PDF",
          print: "Stampa il PDF",
        },
        inputValidator: (value) => {
          if (!value) {
            return "Devi scegliere un'opzione!";
          }
        },
        showCancelButton: true,
        confirmButtonText: "Conferma",
        cancelButtonText: "Annulla",
      });
  
      if (!action) {
        Swal.fire("Operazione annullata", "Nessuna azione è stata eseguita.", "info");
        return;
      }
  
      if (action === "download") {
        // Scarica il PDF
        saveAs(blob, fileName);
        Swal.fire("Successo", "Il PDF è stato scaricato correttamente.", "success");

      } else if (action === "print") {
        // Creazione dell'URL temporaneo per il PDF
        const pdfURL = URL.createObjectURL(blob);
    
        // Creazione di un iframe nascosto per la stampa diretta
        const iframe = document.createElement("iframe");
        iframe.style.display = "none"; // Nasconde l'iframe
        document.body.appendChild(iframe);
    
        iframe.src = pdfURL;
        iframe.onload = () => {
            iframe.contentWindow.print(); // Avvia la stampa
    
            // Se il browser supporta onafterprint, rimuovi l'iframe dopo la stampa
            iframe.contentWindow.onafterprint = () => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(pdfURL); // Libera la memoria
            };
        };
    
        // Gestione degli errori nel caricamento dell'iframe
        iframe.onerror = () => {
            Swal.fire("Errore", "Impossibile avviare la stampa.", "error");
            document.body.removeChild(iframe);
            URL.revokeObjectURL(pdfURL);
        };
    }
    



    } catch (error) {
      console.error("Errore generale:", error.message);
      Swal.fire("Errore", "Si è verificato un errore durante la generazione o la stampa del PDF.", "error");
    }
  };  


  const handlePrintWithoutAdding = async (motivazione) => {
    if (!isStudentNameValid()) return;
  
    try {
      // Ottieni data e ora correnti
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];
      //const formattedTime = currentDate.toTimeString().split(" ")[0];
  
      // Ottieni tutti i ritardi combinati
      const combinedRitardi = getCombinedRitardi();
  
      // Conta il numero di ritardi con motivazione "P"
      const countPersonale = combinedRitardi.filter(
        (ritardo) => ritardo.motivazione === "P"
      ).length;
  
      // Se ci sono già 3 "P", modifica la motivazione in "P*"
      if (motivazione === "P" && countPersonale >= 3) {
        motivazione = "P*";
      }
  
      // Prepara i dati per il PDF utilizzando i ritardi esistenti
      const studentData = {
        ...selectedAlunno,
        ritardi: combinedRitardi, // Usa solo i ritardi esistenti
      };
  
      // Genera il PDF
      const blob = await pdf(<GeneratePDFDocument student={studentData} />).toBlob();
      const fileName = `${selectedAlunno.cognome}_${selectedAlunno.nome}(${formattedDate.split('-').reverse().join('-')}).pdf`;
      
      // Salva il PDF con il nome corretto
      saveAs(blob, fileName);
  
      Swal.fire(
        "Successo",
        `PDF generato e inviato alla stampa con motivazione "${motivazione}"`,
        "success"
      );
    } catch (error) {
      console.error("Errore generale:", error.message);
      Swal.fire("Errore", "Si è verificato un errore imprevisto.", "error");
    }
  };
  

    const handleGenerateExcelForDate = async () => {
    try {
      const { value: selectedDate } = await Swal.fire({
        title: 'Seleziona una data',
        html: '<input type="date" id="selectedDate" class="swal2-input" />',
        preConfirm: () => document.getElementById('selectedDate')?.value,
        showCancelButton: true,
        confirmButtonText: 'Genera Report',
        cancelButtonText: 'Annulla',
      });
  
      if (!selectedDate) {
        Swal.fire('Operazione annullata', 'Nessuna data selezionata', 'info');
        return;
      }
  
      const { data: ritardi, error } = await supabase
        .from('ritardi')
        .select(`
          id_ritardo,
          data,
          orario_ingresso,
          motivazione,
          alunni ( cognome, nome, classi ( nome_classe ) )
        `)
        .eq('data', selectedDate);
  
      if (error) throw error;
  
      if (!ritardi || ritardi.length === 0) {
        Swal.fire('Nessun risultato', 'Non ci sono ritardi per la data selezionata.', 'info');
        return;
      }
  
      const rows = ritardi.map((ritardo, index) => ({
        Numero: index + 1,
        Nominativo: `${ritardo.alunni?.cognome || ''} ${ritardo.alunni?.nome || ''}`.trim(),
        Classe: ritardo.alunni?.classi?.nome_classe || 'N/D',
        Orario: ritardo.orario_ingresso?.slice(0, 5) || 'N/D',
        Motivazione: ritardo.motivazione || 'N/D',
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ritardi');
  
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `Ritardi_${selectedDate}.xlsx`);
  
      Swal.fire('Successo', 'Il report è stato generato con successo!', 'success');
    } catch (error) {
      console.error('Errore durante la generazione del report:', error);
      Swal.fire('Errore', 'Impossibile generare il report.', 'error');
    }
  };
  

  const getCombinedRitardi = () => {
    const combined = [...ritardi, ...ritardiState];
  
    if (combined.length === 0) {
      console.warn("Nessun ritardo combinato trovato.");
    } else {
      console.log(" Ritardi combinati:", combined);
    }
  
    return combined;
  };
  
   
// Fetch iniziale: elenco alunni
useEffect(() => {
  const fetchAlunni = async () => {
    try {
      let allData = []; // Array per raccogliere tutti i dati
      let offset = 0; // Offset iniziale
      const limit = 1000; // Limite massimo per richiesta
      let hasMore = true;

      while (hasMore) {
        // Recupera i dati in blocchi
        const { data, error } = await supabase
          .from('alunni')
          .select('id_alunno, cognome, nome, id_classe, classi(nome_classe)')
          .order('cognome', { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Aggiungi i dati recuperati all'array
        allData = [...allData, ...data];
        hasMore = data.length === limit; // Se il blocco è pieno, continua
        offset += limit; // Incrementa l'offset
      }

      // Elabora i dati ricevuti
      const alunniConClasse = allData.map((alunno) => ({
        ...alunno,
        nominativo: `${alunno.cognome} ${alunno.nome}`.trim(),
        classe: alunno.classi?.nome_classe || 'N/D',
      }));

      setAlunni(alunniConClasse); // Aggiorna lo stato con tutti i dati
    } catch (error) {
      setError(error.message);
      console.error('Errore nel recupero degli alunni:', error.message);
    }
  };

  fetchAlunni();
}, []);

// Funzione per recuperare i dati completi dell'alunno selezionato
const fetchDatiAlunno = useCallback(async (forceRefresh = false) => {
  if (!selectedAlunnoId && !forceRefresh) {
    setRitardi([]);
    setRitardiState([]);
    setSelectedAlunno(null);
    setGenitori([]);
    setCoordinatore(null);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('alunni')
      .select(`
        id_alunno,
        cognome,
        nome,
        id_classe,
        indirizzo_residenza,
        comune_residenza,
        data_nascita,
        alunni_genitori (
          tipo,
          genitori (
            cognome,
            nome,
            email,
            cellulare1,
            cellulare2
          )
        ),
        ritardi (
          id_ritardo,
          data,
          orario_ingresso,
          motivazione,
          emailinviata
        ),
        classi (
          nome_classe,
          coordinatori (
            cognome,
            nome,
            email,
            cellulare
          )
        )
      `)
      .eq('id_alunno', selectedAlunnoId)
      .single();

    if (error) throw error;

    const selectedAlunnoConClasse = {
      ...data,
      nominativo: `${data.cognome} ${data.nome}`.trim(),
      classe: data.classi?.nome_classe || "N/D",
    };

    const genitori = data.alunni_genitori.map((entry) => ({
      tipo: entry.tipo,
      ...entry.genitori,
    }));

    setSelectedAlunno(selectedAlunnoConClasse);
    setRitardi(data.ritardi || []);
    setRitardiState([]);
    setGenitori(genitori);
    setCoordinatore(data.classi?.coordinatori || null);
  } catch (error) {
    setError(error.message);
    console.error("Errore nel recupero dei dati dell'alunno:", error.message);
  }
}, [selectedAlunnoId]);

// Effetto al cambio di `selectedAlunnoId`
useEffect(() => {
  fetchDatiAlunno(); // Recupera i dati dell'alunno
}, [fetchDatiAlunno]);

const formatDateForUI = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}.${month}.${year}`;
};

const updateEmailInviataInDatabase = async (idRitardo) => {
  try {
    const { error } = await supabase
      .from("ritardi")
      .update({ emailinviata: true })
      .eq("id_ritardo", idRitardo);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Errore durante l'aggiornamento di emailinviata:", error.message);
    return false;
  }
};


const handleUpdateEmailInviata = async (idRitardo) => {
  try {
    // Aggiorna nel database per impostare emailinviata = true
    const { error } = await supabase
      .from("ritardi")
      .update({ emailinviata: true })
      .eq("id_ritardo", idRitardo);

    if (error) throw error;

    // Trova l'alunno associato al ritardo inviato
    const ritardo = ritardi.find((r) => r.id_ritardo === idRitardo);
    if (!ritardo) {
      console.warn("Ritardo non trovato nello stato.");
      return;
    }

    const idAlunno = ritardo.id_alunno;

    // Rimuove l'alunno dall'elenco `alunniConRitardi`
    setAlunniConRitardi((prev) => prev.filter((alunno) => alunno.id_alunno !== idAlunno));

    Swal.fire("Successo", "Email inviata e bustina verde aggiunta correttamente!", "success");
  } catch (error) {
    console.error("Errore durante l'aggiornamento:", error.message);
    Swal.fire("Errore", "Si è verificato un errore durante l'aggiornamento.", "error");
  }
};

const removeEmailInviataFromDatabase = async (idRitardo) => {
  try {
    const { error } = await supabase
      .from("ritardi")
      .update({ emailinviata: false })
      .eq("id_ritardo", idRitardo);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Errore durante la rimozione di emailinviata:", error.message);
    return false;
  }
};

const handleRemoveEmailInviata = async (idRitardo) => {
  try {
    // Controlla se l'ID ha già la bustina verde
    const ritardo = ritardi.find((r) => r.id_ritardo === idRitardo);

    if (!ritardo) {
      Swal.fire("Errore", "ID ritardo non trovato.", "error");
      return;
    }

    if (!ritardo.emailinviata) {
      Swal.fire("Errore", "La bustina verde non è presente per questo ritardo.", "error");
      return;
    }

    // Procedi con la rimozione se la bustina verde è presente
    const successo = await removeEmailInviataFromDatabase(idRitardo);

    if (successo) {
      // Aggiorna lo stato locale
      setRitardi((prevRitardi) =>
        prevRitardi.map((ritardo) =>
          ritardo.id_ritardo === idRitardo
            ? { ...ritardo, emailinviata: false }
            : ritardo
        )
      );
      Swal.fire("Successo", "Bustina verde rimossa correttamente!", "success");
    } else {
      Swal.fire("Errore", "Impossibile rimuovere la bustina verde.", "error");
    }
  } catch (error) {
    console.error("Errore durante la rimozione:", error.message);
    Swal.fire("Errore", "Si è verificato un errore durante la rimozione.", "error");
  }
};

const handleDeleteLastRitardo = async () => {
  const combinedRitardi = getCombinedRitardi();

  if (combinedRitardi.length === 0) {
    Swal.fire({
      title: "Errore",
      text: "Non ci sono ritardi da cancellare.",
      icon: "error",
      confirmButtonText: "OK",
    });
    return;
  }

  const lastRitardo = combinedRitardi[combinedRitardi.length - 1];

  if (ritardiState.includes(lastRitardo)) {
    // Cancella dall'elenco locale
    setRitardiState((prev) => prev.slice(0, -1));
  } else {
    // Cancella dal database
    try {
      const { error } = await supabase
        .from("ritardi")
        .delete()
        .eq("id_ritardo", lastRitardo.id_ritardo);

      if (error) throw error;

      setRitardi((prev) => prev.slice(0, -1));
      Swal.fire({
        title: "Successo",
        text: "L'ultimo ritardo è stato cancellato.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      console.error("Errore durante la cancellazione:", err.message);
      Swal.fire({
        title: "Errore",
        text: "Errore durante la connessione al database.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }
};

  // Funzione per validare il nome dell'alunno
  const isStudentNameValid = () => {
    if (!selectedAlunno?.nominativo) {
      Swal.fire({
        title: 'Attenzione',
        text: "Il nome dell'alunno non può essere vuoto.",
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return false;
    }
    return true;
  };

  const updateRitardoInDatabase = async (idRitardo, updateFields) => {
    try {
      const { error } = await supabase
        .from("ritardi")
        .update(updateFields)
        .eq("id_ritardo", idRitardo);
  
      if (error) throw error;
  
      console.log(` Ritardo con ID ${idRitardo} aggiornato con:`, updateFields);
      return true;
    } catch (error) {
      console.error("Errore nell'aggiornamento del ritardo:", error.message);
      return false;
    }
  };
  
  
  const handleUpdateRitardoDate = async (idRitardo, newDate) => {
    const successo = await updateRitardoInDatabase(idRitardo, { data: newDate });
  
    if (successo) {
      // Ricarica i dati dell'alunno per assicurarti che lo stato sia aggiornato
      await fetchDatiAlunno(true); // Passa true per forzare il refresh
      Swal.fire("Successo", "Data aggiornata con successo!", "success");
    } else {
      Swal.fire("Errore", "Non è stato possibile aggiornare la data.", "error");
    }
  };
  
  const handleUpdatePersonaleStarToPersonale = async () => {
    try {
      const combinedRitardi = getCombinedRitardi();

      if (combinedRitardi.length === 0) {
        Swal.fire("Errore", "Non ci sono ritardi da aggiornare.", "error");
        return;
      }

      // Filtra i ritardi con motivazione "Personale*"
      const ritardiToUpdate = combinedRitardi.filter(
        (ritardo) => ritardo.motivazione === "P*"
      );

      if (ritardiToUpdate.length === 0) {
        Swal.fire("Nessun aggiornamento", "Non ci sono ritardi con motivazione 'Personale*'.", "info");
        return;
      }

      // Aggiorna nel database
      const idsToUpdate = ritardiToUpdate.map((ritardo) => ritardo.id_ritardo);

      const { error } = await supabase
        .from("ritardi")
        .update({ motivazione: "P" })
        .in("id_ritardo", idsToUpdate);

      if (error) throw error;

      // Ricarica i dati per aggiornare lo stato
      await fetchDatiAlunno(true);

      Swal.fire("Successo", "Tutti i ritardi con motivazione 'Personale*' sono stati aggiornati a 'Personale'.", "success");
    } catch (error) {
      console.error("Errore durante l'aggiornamento dei ritardi:", error.message);
      Swal.fire("Errore", "Impossibile aggiornare i ritardi.", "error");
    }
  };
    

  // Funzione per generare e scaricare il PDF
  const handleDownloadPDF = async (selectedAlunno, ritardi) => {
    try {
      const studentData = {
        ...selectedAlunno,
        ritardi,
      };

      const blob = await pdf(<GeneratePDFDocument student={studentData} />).toBlob();
      // Crea un nome file nel formato COGNOME_NOME(DATA).pdf
      const currentDate = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
      const fileName = `${selectedAlunno.cognome}_${selectedAlunno.nome}(${currentDate}).pdf`;
      
      // Usa saveAs da file-saver per forzare il download con il nome corretto
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Errore nella generazione del PDF:', error);
    }
  };

  const updateRitardoOraInDatabase = async (idRitardo, nuovaOra) => {
    try {
      const { error } = await supabase
        .from("ritardi")
        .update({ orario_ingresso: nuovaOra })
        .eq("id_ritardo", idRitardo);
  
      if (error) throw error;
  
      return true;
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'ora:", error.message);
      return false;
    }
  };
  
  const handleUpdateRitardoOra = async (idRitardo, newTime) => {
    const successo = await updateRitardoOraInDatabase(idRitardo, newTime);
  
    if (successo) {
      const updatedRitardi = getCombinedRitardi().map((ritardo) =>
        ritardo.id_ritardo === idRitardo ? { ...ritardo, orario_ingresso: newTime } : ritardo
      );
      setRitardi(updatedRitardi);
      Swal.fire("Successo", "Orario aggiornato con successo!", "success");
    } else {
      Swal.fire("Errore", "Non è stato possibile aggiornare l'orario.", "error");
    }
  };
    
  const updateRitardoMotivazioneInDatabase = async (idRitardo, nuovaMotivazione) => {
    try {
      console.log(` Aggiornamento motivazione: ID=${idRitardo}, Motivazione=${nuovaMotivazione}`);
      const { error } = await supabase
        .from("ritardi")
        .update({ motivazione: nuovaMotivazione })
        .eq("id_ritardo", idRitardo);
  
      if (error) throw error;
  
      console.log(` Motivazione aggiornata per ID ${idRitardo}`);
      return true;
    } catch (error) {
      console.error("Errore durante l'aggiornamento della motivazione:", error.message);
      return false;
    }
  };

  const handleUpdateRitardoMotivazione = async (idRitardo, newMotivazione) => {
    console.log(" Inizio aggiornamento motivazione per ID:", idRitardo, "con motivazione:", newMotivazione);

    try {
        const successo = await updateRitardoMotivazioneInDatabase(idRitardo, newMotivazione);

        if (successo) {
            console.log(" Motivazione aggiornata nel database con successo");
            await fetchDatiAlunno(true);
            Swal.fire("Successo", "Motivazione aggiornata con successo!", "success");
        } else {
            console.error(" Errore durante l'aggiornamento della motivazione");
            Swal.fire("Errore", "Impossibile aggiornare la motivazione.", "error");
        }
    } catch (error) {
        console.error(" Errore durante il processo di aggiornamento:", error);
        Swal.fire("Errore", "Si è verificato un errore durante l'aggiornamento.", "error");
    } finally {
        console.log(" Fine processo di modifica motivazione");
    }
};
  
  // FINE DEFINIZIONE FUNZIONI...............................................................................
  // FINE DEFINIZIONE FUNZIONI...............................................................................
  // FINE DEFINIZIONE FUNZIONI...............................................................................
  // FINE DEFINIZIONE FUNZIONI...............................................................................
  // FINE DEFINIZIONE FUNZIONI...............................................................................

  // Funzione per recuperare le aule
  const fetchAule = async () => {
    try {
      const { data, error } = await supabase.from('aule').select('*');
      if (error) throw error;
      setAule(data);
    } catch (error) {
      console.error("Errore nel recupero delle aule:", error);
      setError(error.message);
    }
  };

  // Carica le aule all'avvio del componente
  useEffect(() => {
    fetchAule();
  }, []);

  // Funzione per gestire il click su un'aula
  const handleRoomClick = (roomName) => {
    setSelectedRoom(roomName);
  };

  return (
    <div className="flex justify-center items-start pt-8 min-h-screen bg-gray-200">
      
      {error && (
  <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
    <strong>Errore:</strong> {error}
  </div>
)}

 
 {/* Inizio Card Principale */}
 
 <div className="bg-gray-100 shadow-lg rounded-lg border border-blue-400 w-full max-w-[98%] md:max-w-[1200px] mx-auto min-h-0 h-auto md:h-[1102px] p-4">
  
  <div className="flex flex-col justify-between flex-grow">
{/*
    <ButtonsLayout
      isStudentNameValid={isStudentNameValid}
      handleButtonClick={handleButtonClick}
      handleButtonWithPrintDialog={handleButtonWithPrintDialog}
      handleDownloadPDF={handleDownloadPDF}
      handlePrintWithoutAdding={handlePrintWithoutAdding}
      handleGenerateExcelForDate={handleGenerateExcelForDate}
    />

*/}

  </div>


  {/* Inizio Griglia Principale */}
  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 mt-4">
    {/* Inizio Colonna Sinistra */}
    <div className="w-full space-y-4">
      {/* Calendario e Form */}
      <AulePrenotazione 
        type="calendar" 
        selectedDate={selectedDate} 
        onDateChange={setSelectedDate} 
        onOpenForm={() => setShowPrenotazioneForm(true)}
      />
      {showPrenotazioneForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
            onClick={() => setShowPrenotazioneForm(false)}
            aria-label="Chiudi modal"
          />
          {/* Modal content */}
          <div
            className="relative z-50 w-full max-w-md mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <AulePrenotazione 
              type="form" 
              selectedDate={selectedDate} 
              onDateChange={setSelectedDate}
              onCloseForm={() => setShowPrenotazioneForm(false)}
            />
          </div>
        </div>
      )}
    </div>
    {/* Fine Colonna Sinistra */}

    {/* Inizio Colonna Destra */}
    <div className="w-full space-y-4">
      {/* Dettaglio Prenotazioni */}
      <AulePrenotazione 
        type="list" 
        selectedDate={selectedDate} 
        onDateChange={setSelectedDate}
        onRoomClick={handleRoomClick}
        selectedRoom={selectedRoom}
        onOpenDetail={() => setShowRiepilogoModal(true)}
      />

      {/* Dettaglio Prenotazioni per Aula */}
      {showRiepilogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
            onClick={() => setShowRiepilogoModal(false)}
            aria-label="Chiudi modal riepilogo"
          />
          {/* Modal content */}
          <div
            className="relative z-50 w-full max-w-md mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <AulePrenotazione 
              type="detail" 
              selectedDate={selectedDate} 
              onDateChange={setSelectedDate}
              onRoomClick={handleRoomClick}
              selectedRoom={selectedRoom}
              onCloseDetail={() => setShowRiepilogoModal(false)}
            />
          </div>
        </div>
      )}
    </div>
    {/* Fine Colonna Destra */}
  </div>
  {/* Fine Griglia Principale */}
  
  <div className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-3">
    <Image 
      src="/images/logogug.png" 
      alt="WiGu Logo" 
      width={24}
      height={24}
      className="object-contain"
    />
    Design & Development by <span className="font-semibold text-blue-600">WiGu</span>
  </div>
</div>
{/* Fine Card Principale */}
       
     
    
    </div>
  );
};




export default MainLayout;
