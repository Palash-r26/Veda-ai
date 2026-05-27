'use client';

import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 15,
  },
  infoField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 5,
  },
  infoLine: {
    flex: 1,
    borderBottom: '1pt dotted #9ca3af',
    height: 12,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2pt solid #111827',
    paddingBottom: 5,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionInstructions: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  sectionMarks: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  questionBlock: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  qNum: {
    width: 25,
    fontSize: 11,
    fontWeight: 'bold',
  },
  qContent: {
    flex: 1,
  },
  qText: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  qFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    fontSize: 8,
    padding: '3 6',
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  qMarks: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
  }
});

// ─── Document Component ───────────────────────────────────────────────────────

const PaperDocument = ({ paper, assignment }: { paper: any, assignment: any }) => {
  let globalQNum = 1;

  const totalQuestions = paper.sections.reduce((sum: number, sec: any) => sum + sec.questions.length, 0);
  const totalMarks = paper.sections.reduce((sum: number, sec: any) => sum + sec.questions.reduce((s: number, q: any) => s + q.marks, 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>VedaAI International School</Text>
          <Text style={styles.metaText}>Mid-Term Examination 2026-27</Text>
          <Text style={styles.metaText}>
            Types: {assignment?.questionTypes?.join(', ')} • Total Marks: {totalMarks} • Total Questions: {totalQuestions}
          </Text>
        </View>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>Name:</Text>
            <View style={styles.infoLine} />
          </View>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>Roll No:</Text>
            <View style={styles.infoLine} />
          </View>
          <View style={{ ...styles.infoField, marginRight: 0 }}>
            <Text style={styles.infoLabel}>Section:</Text>
            <View style={styles.infoLine} />
          </View>
        </View>

        {/* Sections */}
        {paper.sections.map((section: any, sIdx: number) => {
          const sectionMarks = section.questions.reduce((s: number, q: any) => s + q.marks, 0);
          
          return (
            <View key={sIdx} style={styles.section}>
              <View style={styles.sectionHeader} wrap={false}>
                <View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionInstructions}>{section.instructions}</Text>
                </View>
                <Text style={styles.sectionMarks}>[{sectionMarks} Marks]</Text>
              </View>

              {section.questions.map((q: any, qIdx: number) => {
                const num = globalQNum++;
                return (
                  <View key={qIdx} style={styles.questionBlock} wrap={false}>
                    <Text style={styles.qNum}>Q{num}.</Text>
                    <View style={styles.qContent}>
                      <Text style={styles.qText}>{q.text}</Text>
                      <View style={styles.qFooter}>
                        <Text style={styles.badge}>{q.difficulty}</Text>
                        <Text style={styles.qMarks}>[{q.marks} {q.marks === 1 ? 'mark' : 'marks'}]</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Footer with Page Numbers */}
        <Text style={styles.footer} fixed>
          Generated by VedaAI Assessment Creator
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

// ─── Export Button Component ──────────────────────────────────────────────────

export default function PdfExport({ paper, assignment }: { paper: any, assignment: any }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<PaperDocument paper={paper} assignment={assignment} />).toBlob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `VedaAI_Assessment_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF document.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors shadow-sm disabled:opacity-70 w-[140px] justify-center"
    >
      {isGenerating ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Preparing...
        </>
      ) : (
        <>
          <Download size={15} />
          Download PDF
        </>
      )}
    </button>
  );
}
