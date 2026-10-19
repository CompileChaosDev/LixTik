// Penyimpanan riwayat download (di browser perangkat ini, lewat localStorage).
window.LX = window.LX || {}

LX.store = {
  KEY: 'lixtik_history',
  LIMIT: 100,

  load() {
    try {
      const list = JSON.parse(localStorage.getItem(this.KEY) || '[]')
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  },

  save(list) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list.slice(0, this.LIMIT)))
    } catch {}
  },

  // entry: { url, platform, title, author, thumb, label }
  record(entry) {
    const list = this.load().filter((item) => !(item.url === entry.url && item.label === entry.label))
    list.unshift({ id: Date.now(), ...entry })
    this.save(list)
  },

  remove(id) {
    this.save(this.load().filter((item) => item.id !== id))
  },

  clear() {
    this.save([])
  },

  stats() {
    const list = this.load()
    const today = new Date().toDateString()
    return {
      total: list.length,
      today: list.filter((item) => new Date(item.id).toDateString() === today).length
    }
  }
}
