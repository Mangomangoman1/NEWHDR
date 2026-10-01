(function () {
  document.documentElement.classList.add("tips-js");

  var searchForm = document.getElementById("resourceSearch");
  var searchInput = document.getElementById("resourceSearchInput");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-resource-filter]"));
  var guides = Array.prototype.slice.call(document.querySelectorAll("[data-guide]"));
  var groups = Array.prototype.slice.call(document.querySelectorAll("[data-guide-group]"));
  var resultNumber = document.getElementById("resourceResultNumber");
  var resultLabel = document.getElementById("resourceResultLabel");
  var emptyState = document.getElementById("resourceEmpty");
  var activeCategory = "all";
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function normalize(value) {
    return (value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  var guideMetadata = guides.map(function (guide) {
    return {
      categories: (guide.getAttribute("data-category") || "").split(/\s+/),
      haystack: normalize((guide.getAttribute("data-search") || "") + " " + guide.textContent)
    };
  });

  function applyFilters() {
    var query = normalize(searchInput ? searchInput.value : "");
    var terms = query ? query.split(/\s+/) : [];
    var visibleCount = 0;

    guides.forEach(function (guide, index) {
      var categories = guideMetadata[index].categories;
      var haystack = guideMetadata[index].haystack;
      var categoryMatch = activeCategory === "all" || categories.indexOf(activeCategory) !== -1;
      var queryMatch = terms.every(function (term) {
        return haystack.indexOf(term) !== -1 ||
          (term === "charge" && haystack.indexOf("charging") !== -1) ||
          (term === "charging" && haystack.indexOf("charge") !== -1);
      });
      var visible = categoryMatch && queryMatch;
      guide.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    groups.forEach(function (group) {
      group.hidden = group.querySelectorAll("[data-guide]:not([hidden])").length === 0;
    });

    if (resultNumber && resultNumber.textContent !== String(visibleCount)) resultNumber.textContent = visibleCount;
    var label = visibleCount === 1 ? "guide" : "guides";
    if (resultLabel && resultLabel.textContent !== label) resultLabel.textContent = label;
    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
      emptyState.classList.toggle("is-visible", visibleCount === 0);
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeCategory = button.getAttribute("data-resource-filter") || "all";
      filterButtons.forEach(function (candidate) {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      });
      applyFilters();
      document.getElementById("library")?.scrollIntoView({ behavior: motion.matches ? "instant" : "smooth", block: "start" });
    });
  });

  if (searchInput) {
    var composing = false;
    searchInput.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || composing || event.isComposing || !searchInput.value) return;
      event.preventDefault();
      searchInput.value = "";
      applyFilters();
    });
    searchInput.addEventListener("compositionstart", function () { composing = true; });
    searchInput.addEventListener("compositionend", function () { composing = false; applyFilters(); });
    searchInput.addEventListener("input", function (event) {
      if (!composing && !event.isComposing) applyFilters();
    });
  }
  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilters();
      document.getElementById("library")?.scrollIntoView({ behavior: motion.matches ? "instant" : "smooth", block: "start" });
    });
  }

  document.querySelectorAll("[data-search-preset]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      if (searchInput) searchInput.value = link.getAttribute("data-search-preset") || "";
      activeCategory = "all";
      filterButtons.forEach(function (candidate) {
        candidate.setAttribute("aria-pressed", String(candidate.getAttribute("data-resource-filter") === "all"));
      });
      applyFilters();
      document.getElementById("library")?.scrollIntoView({ behavior: motion.matches ? "instant" : "smooth", block: "start" });
    });
  });

  if (!motion.matches && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: "0px 0px -40px" });
    document.querySelectorAll(".rh-reveal").forEach(function (element) { observer.observe(element); });
  } else {
    document.querySelectorAll(".rh-reveal").forEach(function (element) { element.classList.add("is-visible"); });
  }

  applyFilters();
})();
