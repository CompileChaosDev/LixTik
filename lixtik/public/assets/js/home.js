// Homepage: kartu fitur dibuat otomatis dari daftar di features.js.
LX.pages.home = function () {
  const card = (f) => {
    const inner = `
      <span class="s-icon">${LX.icons[f.icon] || LX.icons.grid}</span>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
      ${f.soon ? '<span class="tag">Segera</span>' : ''}`
    return f.soon
      ? `<div class="hub-card soon" style="--cc:${f.color}">${inner}</div>`
      : `<a class="hub-card" href="${f.path}" style="--cc:${f.color}">${inner}</a>`
  }

  LX.$('hub').innerHTML = LX.groups.map((g) => {
    const items = LX.featuresIn(g.id)
    if (!items.length) return ''
    return `
      <section class="hub-group">
        <div class="hub-head"><h2>${g.title}</h2></div>
        <div class="hub-grid">${items.map(card).join('')}</div>
      </section>`
  }).join('')
}
