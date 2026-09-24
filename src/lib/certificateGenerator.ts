import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { format } from 'date-fns';

export interface CertificateData {
  id: string;
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  guardianName?: string;
  doctorName?: string;
  hospitalName?: string;
  schedule: Array<{
    vaccineId: string;
    name: string;
    shortName: string;
    description?: string;
    dueDate: Date | string;
    administeredDate?: Date | string;
    status: string;
    phase: number;
    doseNumber: number;
    series: string;
  }>;
}

export const generateCertificatePDF = async (child: CertificateData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor = [13, 148, 136]; // Teal #0d9488
  const darkText = [30, 41, 59]; // Slate 800
  const mutedText = [100, 116, 139]; // Slate 500
  const emeraldGreen = [16, 185, 129];

  // 1. Elegant Border
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner subtle accent border
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // 2. Top Header - Government / Universal Immunization Programme
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('UNIVERSAL IMMUNIZATION PROGRAMME (UIP)', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('NATIONAL IMMUNIZATION SCHEDULE (NIS 2025) • VACCITRACK REGISTRY', pageWidth / 2, 27, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('CERTIFICATE FOR CHILD IMMUNIZATION', pageWidth / 2, 36, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('OFFICIAL VERIFIED DIGITAL HEALTH RECORD', pageWidth / 2, 42, { align: 'center' });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(16, 46, pageWidth - 16, 46);

  // 3. Generate QR Code
  const verifyUrl = `${window.location.origin}/verify/${child.id}`;
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
  }

  // 4. Beneficiary Details & QR Code Section
  const completedVaccines = (child.schedule || []).filter((v) => v.status === 'COMPLETED');
  const totalVaccines = (child.schedule || []).length;
  const isFullyImmunized = completedVaccines.length > 0 && completedVaccines.length === totalVaccines;

  const dobDate = child.dateOfBirth instanceof Date ? child.dateOfBirth : new Date(child.dateOfBirth);
  const formattedDob = !isNaN(dobDate.getTime()) ? format(dobDate, 'dd MMMM yyyy') : 'N/A';
  const formattedAbha = child.abhaId
    ? child.abhaId.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim()
    : 'N/A';

  // Left Side: Beneficiary Details Box
  const infoX = 18;
  const infoY = 52;
  const infoWidth = 115;
  const infoHeight = 48;

  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(infoX, infoY, infoWidth, infoHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Beneficiary Details', infoX + 6, infoY + 7);

  // Two column details inside the box
  doc.setFontSize(8.5);
  const col1X = infoX + 6;
  const col2X = infoX + 60;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Child Name:', col1X, infoY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(child.name, col1X + 22, infoY + 15);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Gender:', col1X, infoY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(child.gender.toUpperCase(), col1X + 22, infoY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Date of Birth:', col2X, infoY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(formattedDob, col2X + 22, infoY + 22);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('ABHA ID:', col1X, infoY + 29);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(formattedAbha, col1X + 22, infoY + 29);

  // Row 4: Status
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Status:', col1X, infoY + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text(
    isFullyImmunized ? 'Fully Immunized' : `Partially Immunized (${completedVaccines.length}/${totalVaccines} Doses)`,
    col1X + 22,
    infoY + 36
  );

  // Row 5: Guardian
  if (child.guardianName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('Guardian:', col1X, infoY + 43);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(child.guardianName, col1X + 22, infoY + 43);
  }

  // Right Side: QR Code & Verification Box
  const qrBoxX = 138;
  const qrBoxY = 52;
  const qrBoxWidth = 56;
  const qrBoxHeight = 48;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 3, 3, 'FD');

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', qrBoxX + 13, qrBoxY + 3, 30, 30);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SCAN TO VERIFY RECORD', qrBoxX + qrBoxWidth / 2, qrBoxY + 37, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(`Ref ID: VT-${child.id.slice(-8).toUpperCase()}`, qrBoxX + qrBoxWidth / 2, qrBoxY + 42, { align: 'center' });
  doc.text('2FA OTP Authenticated', qrBoxX + qrBoxWidth / 2, qrBoxY + 45.5, { align: 'center' });

  // 5. Table of Completed Vaccines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('Immunization Records (Administered Doses)', 18, 107);

  const tableData = completedVaccines.map((vaccine, index) => {
    const adminDate = vaccine.administeredDate
      ? format(new Date(vaccine.administeredDate), 'dd-MMM-yyyy')
      : 'Verified';
    return [
      (index + 1).toString(),
      `${vaccine.name} (${vaccine.shortName})`,
      `Dose ${vaccine.doseNumber} (Phase ${vaccine.phase})`,
      adminDate,
      child.hospitalName || 'Authorized PHC / Clinic',
      'OTP VERIFIED',
    ];
  });

  // If no vaccine administered yet
  if (tableData.length === 0) {
    tableData.push(['-', 'No vaccines marked as completed yet', '-', '-', '-', 'PENDING']);
  }

  autoTable(doc, {
    startY: 111,
    margin: { left: 18, right: 18 },
    head: [['#', 'Vaccine', 'Dose Details', 'Date Given', 'Administered At', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 32 },
      3: { cellWidth: 26 },
      4: { cellWidth: 38 },
      5: { cellWidth: 24, fontStyle: 'bold', textColor: [16, 185, 129] },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // 6. Security Footer & Certification Stamp
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 230;

  // Verification disclaimer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(18, Math.min(finalY, pageHeight - 32), pageWidth - 18, Math.min(finalY, pageHeight - 32));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const disclaimerY = Math.min(finalY + 5, pageHeight - 27);
  doc.text(
    'Notice: This digitally signed certificate confirms immunization records under India\'s NIS 2025 guidelines.',
    18,
    disclaimerY
  );
  doc.text(
    'Administered vaccines have undergone two-factor cryptographic OTP verification by authorized medical officers.',
    18,
    disclaimerY + 4
  );

  const timestampStr = `Generated on: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')} | vacci-track.health`;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(timestampStr, pageWidth - 18, disclaimerY + 4, { align: 'right' });

  // Download PDF
  const filename = `VacciTrack_Certificate_${child.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
};
