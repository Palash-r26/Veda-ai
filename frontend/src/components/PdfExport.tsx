'use client';

import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { Download, Loader2, CloudDownload } from 'lucide-react';
import toast from 'react-hot-toast';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  headerBox: {
    marginBottom: 15,
    borderBottom: '2pt solid #111827',
    paddingBottom: 15,
  },
  headerTop: {
    marginBottom: 15,
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
    color: '#111827',
  },
  examType: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#6b7280',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 5,
  },
  infoText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  studentInfoRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  studentFieldWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  studentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 4,
    color: '#4b5563',
  },
  studentLine: {
    flex: 1,
    borderBottom: '1pt dashed #9ca3af',
    marginRight: 15,
  },
  instructionsBox: {
    marginBottom: 25,
    padding: 12,
    border: '1pt solid #e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  instructionItem: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 3,
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
        
        {/* ── Standard Paper Header ── */}
        <View style={styles.headerBox}>
          {/* Top part: School Name */}
          <View style={styles.headerTop}>
            <Text style={styles.schoolName}>{assignment?.schoolName || 'Delhi Public School'}</Text>
            <Text style={styles.examType}>Terminal Examination</Text>
          </View>

          {/* Info Rows */}
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Subject: {assignment?.subject || 'English'}</Text>
            <Text style={styles.infoText}>Time Allowed: {assignment?.timeAllowed || '3 Hours'}</Text>
          </View>
          <View style={{ ...styles.infoRow, marginBottom: 15 }}>
            <Text style={styles.infoText}>Class: {assignment?.grade || 'Class 10'}</Text>
            <Text style={styles.infoText}>Maximum Marks: {totalMarks}</Text>
          </View>

          {/* Student Info Row */}
          <View style={styles.studentInfoRow}>
            <View style={styles.studentFieldWrap}>
              <Text style={styles.studentLabel}>Name:</Text>
              <View style={styles.studentLine} />
            </View>
            <View style={{ ...styles.studentFieldWrap, flex: 0.6 }}>
              <Text style={styles.studentLabel}>Roll No:</Text>
              <View style={styles.studentLine} />
            </View>
            <View style={{ ...styles.studentFieldWrap, flex: 0.4 }}>
              <Text style={styles.studentLabel}>Section:</Text>
              <View style={{ ...styles.studentLine, marginRight: 0 }} />
            </View>
          </View>
        </View>

        {/* Guidelines */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>General Instructions:</Text>
          <Text style={styles.instructionItem}>1. Read all questions carefully before answering.</Text>
          <Text style={styles.instructionItem}>2. All questions are compulsory unless stated otherwise in a specific section.</Text>
          <Text style={styles.instructionItem}>3. Write your answers neatly and legibly.</Text>
          <Text style={styles.instructionItem}>4. The question paper consists of various sections, each with its own specific instructions.</Text>
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
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF document.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center justify-center gap-2 md:px-6 md:py-2.5 rounded-full md:bg-white md:text-gray-900 text-white bg-white/10 w-10 h-10 md:w-auto md:h-auto text-[14px] font-bold hover:bg-white/20 md:hover:bg-gray-50 transition-transform hover:scale-105 shadow-sm disabled:opacity-70 disabled:hover:scale-100"
    >
      {isGenerating ? (
        <>
          <Loader2 size={18} className="animate-spin md:text-gray-900 text-white" />
          <span className="hidden md:inline">Preparing...</span>
        </>
      ) : (
        <>
          <CloudDownload size={18} className="md:text-gray-900 text-white" />
          <span className="hidden md:inline">Download as PDF</span>
        </>
      )}
    </button>
  );
}
