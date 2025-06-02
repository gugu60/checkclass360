/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Registra il font Carlito
Font.register({
  family: 'Carlito',
  fonts: [
    {
      src: '/fonts/Carlito-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/Carlito-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Funzione per la tabella (motivi semplici)
const mapMotivazione = (symbol: string | undefined): string => {
  if (!symbol) return '';
  switch (symbol.trim().toUpperCase()) {
    case 'P':
      return 'Personale';
    case 'T':
      return 'Trasporto';
    case 'M':
      return 'Salute';
    case 'S':
      return 'Sport';
    case 'P*':
      return 'Personale*';
    default:
      return '';
  }
};

// Funzione per il testo descrittivo (con preposizioni)
const mapMotivazioneDescrittivo = (symbol: string | undefined): string => {
  if (!symbol) return '';
  switch (symbol.trim().toUpperCase()) {
    case 'P':
      return 'Personali';
    case 'T':
      return 'di Trasporto';
    case 'M':
      return 'di Salute';
    case 'S':
      return 'Sportivi';
    case 'P*':
      return 'Personali*';
    default:
      return '';
  }
};

// Funzione per ottenere la data corrente
const getCurrentDate = () => {
  return new Date().toLocaleDateString('it-IT');
};

// Funzione per formattare la data nel formato dd.mm.yyyy
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${date.getFullYear()}`;
};

// Funzione per formattare l'orario nel formato HH:mm
const formatTime = (timeString: string) => {
  if (!timeString) return '';
  return timeString.split(':').slice(0, 2).join(':');
};

const styles = StyleSheet.create({
  page: {
    paddingTop: '5mm',
    paddingBottom: '10mm',
    paddingLeft: '20mm',
    paddingRight: '20mm',
    fontSize: 12,
    fontFamily: 'Carlito',
  },
  logo: {
    width: '20mm',
    height: '20mm',
    position: 'absolute',
    top: '5mm',
    left: '20mm',
  },
  header: {
    textAlign: 'center',
    marginBottom: '5mm',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  headerOffice: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerAuthorization: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerYear: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sassariDate: {
    marginTop: '15mm',
    fontSize: 11,
  },
  studentInfo: {
    marginTop: '10mm',
    fontSize: 11,
  },
  tableContainer: {
    marginTop: '65mm',
    width: '100%',
  },
  table: {
    width: '170mm',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    height: '5mm',
  },
  tableCell: {
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 0.2,
    padding: 1,
    textAlign: 'center',
    fontSize: 8,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 9,
  },
  numberCell: {
    width: '10mm',
  },
  dataCell: {
    width: '25mm',
  },
  firmaContainer: {
    position: 'absolute',
    top: '90mm',
    right: '60mm',
    textAlign: 'center'
  },
  firmaText: {
    fontSize: 12,
    fontFamily: 'Carlito',
    fontWeight: 'normal',
  },
});

interface Props {
  student: Student;
  type?: 'authorization' | 'report';
}

interface Student {
  nominativo: string;
  classe: string;
  ritardi?: {
    data: string;
    orario_ingresso: string;
    motivazione: string;
  }[];
}

const GeneratePDFDocument: React.FC<Props> = ({ student, type = 'authorization' }) => {
  if (!student || !student.nominativo) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Errore: nessun dato dello studente disponibile.</Text>
        </Page>
      </Document>
    );
  }

  // Determina il titolo in base al tipo
  const getTitle = () => {
    switch(type) {
      case 'report':
        return "Prospetto dei ritardi registrati";
      default:
        return "Autorizzazione ingresso posticipato";
    }
  };

  // Determina il testo descrittivo in base al tipo
  const getDescription = () => {
    if (type === 'report') {
      return `Si riporta di seguito il prospetto dei ritardi registrati per l'alunno/a ${student.nominativo} della classe ${student.classe}.`;
    }
    
    return `${student.nominativo} [${student.classe}], in ritardo per motivi ${
      student.ritardi && student.ritardi.length > 0
        ? mapMotivazioneDescrittivo(student.ritardi[student.ritardi.length - 1].motivazione)
        : '___'
    }, è autorizzato/a ad entrare in aula alle ${
      student.ritardi && student.ritardi.length > 0
        ? formatTime(student.ritardi[student.ritardi.length - 1].orario_ingresso)
        : '___'
    }`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image style={styles.logo} src="/images/logo.png" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>I.T.I. &quot;G.M. Angioy&quot; - Sassari</Text>
          <Text style={styles.headerOffice}>Ufficio Accoglienza</Text>
          <Text style={styles.headerAuthorization}>{getTitle()}</Text>
          <Text style={styles.headerYear}>Anno scolastico 2024 - 2025</Text>
        </View>
        <View style={styles.sassariDate}>
          <Text>Sassari, {getCurrentDate()}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text>{getDescription()}</Text>
        </View>
        <View style={styles.tableContainer}>
        <Text style={{ fontSize: 10, marginBottom: 5 }}>
        Nota: Personale*, significa ritardo per motivi personali non ancora giustificato.
        </Text>      
               <View style={styles.table}>
              <View style={styles.tableRow}>              
              <Text style={[styles.tableCell, styles.tableHeader, styles.numberCell]}>N.</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.dataCell]}>Data</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.dataCell]}>Ora</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.dataCell]}>Motivo</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.numberCell]}>N.</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.dataCell]}>Data</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.dataCell]}>Ora</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.dataCell]}>Motivo</Text>
            </View>
            {Array.from({ length: 25 }).map((_, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={[styles.tableCell, styles.numberCell]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.dataCell]}>
                  {formatDate(student.ritardi?.[index]?.data || '')}
                </Text>
                <Text style={[styles.tableCell, styles.dataCell]}>
                  {formatTime(student.ritardi?.[index]?.orario_ingresso || '')}
                </Text>
                <Text style={[styles.tableCell, styles.dataCell]}>
                  {mapMotivazione(student.ritardi?.[index]?.motivazione)}
                </Text>
                <Text style={[styles.tableCell, styles.numberCell]}>{index + 26}</Text>
                <Text style={[styles.tableCell, styles.dataCell]}>
                  {formatDate(student.ritardi?.[index + 25]?.data || '')}
                </Text>
                <Text style={[styles.tableCell, styles.dataCell]}>
                  {formatTime(student.ritardi?.[index + 25]?.orario_ingresso || '')}
                </Text>
                <Text style={[styles.tableCell, styles.dataCell]}>
                  {mapMotivazione(student.ritardi?.[index + 25]?.motivazione)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Image 
          style={{ 
            width: '30mm', 
            height: '30mm', 
            position: 'absolute',
            top: '80mm',
            right: '20mm'
          }} 
          src="/images/timbro.png" 
        />
        <View style={styles.firmaContainer}>
        <Text style={styles.firmaText}>L&apos;incaricato in servizio</Text>
        <Text style={styles.firmaText}>nell&apos;Ufficio Accoglienza</Text>
        </View>
      </Page>
    </Document>
  );
};

export default GeneratePDFDocument;