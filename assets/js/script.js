// async function loadComponent(element) {
//   const component = element.getAttribute("data-component");

//   const response = await fetch(`components/${component}.html`);

//   if (!response.ok) {
//     console.error(`Component "${component}" not found.`);
//     return;
//   }

//   const html = await response.text();

//   const template = document.createElement("template");
//   template.innerHTML = html;

//   // Get data-* value
//   const getValue = (key) => {
//     return element.getAttribute(`data-${key.trim()}`) ?? "";
//   };

//   // --------------------------------
//   // 1. Replace attributes
//   // --------------------------------
//   template.content.querySelectorAll("*").forEach((node) => {
//     [...node.attributes].forEach((attribute) => {
//       const originalValue = attribute.value;

//       if (!originalValue.includes("{{")) {
//         return;
//       }

//       let newValue = originalValue.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => getValue(key));

//       // Remove extra whitespace from class
//       if (attribute.name === "class") {
//         newValue = newValue.split(/\s+/).filter(Boolean).join(" ");
//       }

//       if (newValue) {
//         node.setAttribute(attribute.name, newValue);
//       } else {
//         node.removeAttribute(attribute.name);
//       }
//     });
//   });

//   // --------------------------------
//   // 2. Replace text
//   // --------------------------------
//   const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);

//   const textNodes = [];

//   while (walker.nextNode()) {
//     textNodes.push(walker.currentNode);
//   }

//   textNodes.forEach((textNode) => {
//     textNode.textContent = textNode.textContent.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => getValue(key));
//   });

//   // --------------------------------
//   // 3. Find nested components
//   // --------------------------------
//   const nestedComponents = [...template.content.querySelectorAll("[data-component]")];

//   // --------------------------------
//   // 4. Replace nested component props
//   // --------------------------------
//   nestedComponents.forEach((nestedComponent) => {
//     [...nestedComponent.attributes].forEach((attribute) => {
//       const originalValue = attribute.value;

//       if (!originalValue.includes("{{")) {
//         return;
//       }

//       const newValue = originalValue.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => getValue(key));

//       nestedComponent.setAttribute(attribute.name, newValue);
//     });
//   });

//   // --------------------------------
//   // 5. Replace current component
//   // --------------------------------
//   element.replaceWith(template.content);

//   // --------------------------------
//   // 6. Load nested components
//   // --------------------------------
//   for (const nestedComponent of nestedComponents) {
//     await loadComponent(nestedComponent);
//   }
// }

// // Load page components
// document.querySelectorAll("[data-component]").forEach((element) => loadComponent(element));

async function loadComponent(element) {
  const component = element.getAttribute("data-component");

  const response = await fetch(`components/${component}.html`);

  if (!response.ok) {
    console.error(`Component "${component}" not found.`);
    return;
  }

  const html = await response.text();

  const template = document.createElement("template");
  template.innerHTML = html;

  const getValue = (key) => {
    return element.getAttribute(`data-${key.trim()}`) ?? "";
  };

  // ========================================
  // 1. Replace attributes
  // ========================================
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const originalValue = attribute.value;

      if (!originalValue.includes("{{")) {
        return;
      }

      let newValue = originalValue.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => getValue(key));

      // Remove extra class whitespace
      if (attribute.name === "class") {
        newValue = newValue.split(/\s+/).filter(Boolean).join(" ");
      }

      if (newValue.trim()) {
        node.setAttribute(attribute.name, newValue);
      } else {
        node.removeAttribute(attribute.name);
      }
    });
  });

  // ========================================
  // 2. Replace text
  // ========================================
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);

  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((textNode) => {
    textNode.textContent = textNode.textContent.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => getValue(key));
  });

  // ========================================
  // 3. Resolve nested component props
  // ========================================
  const nestedComponents = [...template.content.querySelectorAll("[data-component]")];

  nestedComponents.forEach((nestedComponent) => {
    [...nestedComponent.attributes].forEach((attribute) => {
      const originalValue = attribute.value;

      if (!originalValue.includes("{{")) {
        return;
      }

      const newValue = originalValue.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => getValue(key));

      if (newValue.trim()) {
        nestedComponent.setAttribute(attribute.name, newValue);
      } else {
        nestedComponent.removeAttribute(attribute.name);
      }
    });
  });

  // ========================================
  // 4. Load nested components
  // ========================================
  for (const nestedComponent of nestedComponents) {
    await loadComponent(nestedComponent);
  }

  // ========================================
  // 5. Remove empty elements
  // ========================================
  removeEmptyElements(template.content);

  // ========================================
  // 6. Insert component into page
  // ========================================
  element.replaceWith(template.content);
}

// ========================================
// Remove empty elements from ONLY this fragment
// ========================================
function removeEmptyElements(fragment) {
  const voidElements = new Set(["AREA", "BASE", "BR", "COL", "EMBED", "HR", "IMG", "INPUT", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"]);

  let changed = true;

  while (changed) {
    changed = false;

    [...fragment.querySelectorAll("*")].reverse().forEach((node) => {
      // Never remove void elements
      if (voidElements.has(node.tagName)) {
        return;
      }

      // Don't remove component placeholders
      if (node.hasAttribute("data-component")) {
        return;
      }

      // If it has child elements, check again
      // on the next cleanup pass
      if (node.children.length > 0) {
        return;
      }

      // Remove if no meaningful text
      if (!node.textContent.trim()) {
        node.remove();
        changed = true;
      }
    });
  }

  // Remove images that don't have src
  fragment.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");

    if (!src || !src.trim()) {
      img.remove();
    }
  });

  // Remove parents that became empty after images were removed
  changed = true;

  while (changed) {
    changed = false;

    [...fragment.querySelectorAll("*")].reverse().forEach((node) => {
      if (voidElements.has(node.tagName)) {
        return;
      }

      if (node.children.length === 0 && !node.textContent.trim()) {
        node.remove();
        changed = true;
      }
    });
  }
}

// ========================================
// Load page components
// ========================================
document.querySelectorAll("[data-component]").forEach((element) => loadComponent(element));
