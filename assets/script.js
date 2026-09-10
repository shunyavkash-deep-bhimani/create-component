document.querySelectorAll("[data-component]").forEach(async (element) => {
  const component = element.dataset.component;

  const response = await fetch(`components/${component}.html`);
  const html = await response.text();

  element.innerHTML = html;
});
