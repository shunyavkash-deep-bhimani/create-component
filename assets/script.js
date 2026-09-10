// document.querySelectorAll("[data-component]").forEach(async (element) => {
//   const component = element.dataset.component;

//   const response = await fetch(`components/${component}.html`);
//   const html = await response.text();

//   element.innerHTML = html;
// });

document.querySelectorAll("[data-component]").forEach(async (element) => {
  const component = element.dataset.component;

  const response = await fetch(`components/${component}.html`);

  if (!response.ok) {
    console.error(`Component "${component}" not found.`);
    return;
  }

  const html = await response.text();

  element.replaceWith(document.createRange().createContextualFragment(html));
});
