// Halaman Panduan: langkah tiap platform dibaca dari platforms.js (satu sumber).
LX.pages.guide = function () {
  LX.$('guide-list').innerHTML = LX.featuresIn('downloader').map((f, index) => {
    const p = LX.platforms[f.id]
    if (!p) return ''
    return `
      <details class="guide-card" ${index === 0 ? 'open' : ''}>
        <summary><span class="chip">${LX.icons[f.icon] || ''}</span>${p.name}</summary>
        <ol>${p.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
        ${p.note ? `<p class="guide-note">${p.note}</p>` : ''}
      </details>`
  }).join('')
}
