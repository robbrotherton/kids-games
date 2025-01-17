function updateVh() {
  let vh = window.visualViewport.height * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', updateVh);
window.addEventListener('orientationchange', updateVh);

// Initial call to set the value
console.log("setting vh");
updateVh();
