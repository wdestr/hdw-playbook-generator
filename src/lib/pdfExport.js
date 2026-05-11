export async function exportPlaybookPDF(moduleRefs, name = 'HDW Playbook') {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;

  const moduleIds = ['brief', 'sessions', 'skipList', 'boothStrategy', 'networkingTargets', 'schedule', 'conversationStarters', 'linkedInDraft'];

  let isFirstPage = true;

  for (const id of moduleIds) {
    const el = moduleRefs[id];
    if (!el) continue;

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0f',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // If the module fits on one page
      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, imgHeight);
      } else {
        // Split across multiple pages
        let yOffset = 0;
        while (yOffset < imgHeight) {
          const sliceHeight = Math.min(pageHeight - margin * 2, imgHeight - yOffset);
          const srcY = (yOffset / imgHeight) * canvas.height;
          const srcH = (sliceHeight / imgHeight) * canvas.height;

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          const sliceData = sliceCanvas.toDataURL('image/png');
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(sliceData, 'PNG', margin, margin, usableWidth, sliceHeight);
          yOffset += sliceHeight;
        }
      }
    } catch (err) {
      console.warn(`PDF export skipped module ${id}:`, err);
    }
  }

  const filename = `hdw-2026-playbook-${name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  pdf.save(filename);
}
