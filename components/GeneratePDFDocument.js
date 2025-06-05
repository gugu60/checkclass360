import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  filters: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  filterLabel: {
    width: 100,
    fontWeight: 'bold',
  },
  filterValue: {
    flex: 1,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#bfbfbf',
  },
  tableCellLast: {
    padding: 5,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
});

const GeneratePDFDocument = ({ student, reportData }) => {
  // Se reportData è presente, generiamo un report di prenotazioni
  if (reportData) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{reportData.title}</Text>
          </View>

          <View style={styles.filters}>
            <Text style={styles.subtitle}>Filtri applicati:</Text>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Periodo:</Text>
              <Text style={styles.filterValue}>{reportData.filters.periodo}</Text>
            </View>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Aula:</Text>
              <Text style={styles.filterValue}>{reportData.filters.aula}</Text>
            </View>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Docente:</Text>
              <Text style={styles.filterValue}>{reportData.filters.docente}</Text>
            </View>
          </View>

          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Data</Text>
              <Text style={styles.tableCell}>Ora Inizio</Text>
              <Text style={styles.tableCell}>Ora Fine</Text>
              <Text style={styles.tableCell}>Aula</Text>
              <Text style={styles.tableCell}>Docente</Text>
              <Text style={styles.tableCellLast}>Motivo</Text>
            </View>

            {/* Rows */}
            {reportData.prenotazioni.map((prenotazione, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{prenotazione.data}</Text>
                <Text style={styles.tableCell}>{prenotazione.ora_inizio}</Text>
                <Text style={styles.tableCell}>{prenotazione.ora_fine}</Text>
                <Text style={styles.tableCell}>{prenotazione.aula}</Text>
                <Text style={styles.tableCell}>{prenotazione.docente}</Text>
                <Text style={styles.tableCellLast}>{prenotazione.motivo}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>
            Report generato il {new Date().toLocaleDateString('it-IT')}
          </Text>
        </Page>
      </Document>
    );
  }

  // Altrimenti generiamo il report dello studente (comportamento esistente)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Ritardi</Text>
          <Text style={styles.subtitle}>
            Studente: {student?.cognome} {student?.nome}
          </Text>
          <Text style={styles.subtitle}>Classe: {student?.classe || 'N/D'}</Text>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Data</Text>
            <Text style={styles.tableCell}>Orario</Text>
            <Text style={styles.tableCellLast}>Motivazione</Text>
          </View>

          {/* Rows */}
          {student?.ritardi?.map((ritardo, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {ritardo.data.split('-').reverse().join('.')}
              </Text>
              <Text style={styles.tableCell}>
                {ritardo.orario_ingresso?.slice(0, 5)}
              </Text>
              <Text style={styles.tableCellLast}>{ritardo.motivazione}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Report generato il {new Date().toLocaleDateString('it-IT')}
        </Text>
      </Page>
    </Document>
  );
};

export default GeneratePDFDocument; 