LX.pages.home = function () {
  LX.$('hub').innerHTML = `
    <section class="home-page home-shell">
      <div class="welcome-wrap">
        <img class="welcome-banner" src="/assets/img/welcome-banner.jpg" alt="Welcome" referrerpolicy="no-referrer">
        <img class="welcome-profile" src="/assets/img/profile.jpg" alt="">
      </div>
      <p class="welcome-text">${LX.config.name} — alat pengunduh serbaguna untuk simpan video, audio, dan gambar dari berbagai platform media sosial dalam satu tempat. Praktis dan cepat!</p>
      <footer class="footer"><p>&copy; 2026 ${LX.config.name}</p></footer>
    </section>`
}
