// Simple sidebar toggle for small screens
(function(){
  const toggle = document.getElementById('toggleBtn');
  const sidebar = document.getElementById('sidebar');
  if(!toggle || !sidebar) return;
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('show');
  });
})();
