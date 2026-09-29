(function () {
  "use strict";

  var root = document.documentElement;

  var yearNodes = document.querySelectorAll("[data-year]");
  var currentYear = String(new Date().getFullYear());
  for (var i = 0; i < yearNodes.length; i += 1) {
    yearNodes[i].textContent = currentYear;
  }

  var STORAGE_KEY = "lv-theme";
  var themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      var isDark = theme === "dark";
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  var savedTheme = null;
  try {
    savedTheme = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    savedTheme = null;
  }

  applyTheme(savedTheme === "dark" ? "dark" : "light");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (error) {
        return;
      }
    });
  }

  var sidebar = document.getElementById("sidebar");
  var menuToggle = document.getElementById("menuToggle");
  var menuClose = document.getElementById("menuClose");
  var scrim = document.getElementById("scrim");

  function isMobileNav() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  function openMenu() {
    if (!sidebar) {
      return;
    }
    sidebar.classList.add("is-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "true");
    }
    if (scrim) {
      scrim.hidden = false;
      window.requestAnimationFrame(function () {
        scrim.classList.add("is-visible");
      });
    }
    document.body.style.overflow = "hidden";
    var firstLink = sidebar.querySelector(".nav__link");
    if (firstLink && isMobileNav()) {
      firstLink.focus({ preventScroll: true });
    }
  }

  function closeMenu() {
    if (!sidebar) {
      return;
    }
    var wasOpen = sidebar.classList.contains("is-open");
    sidebar.classList.remove("is-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
    }
    if (scrim && !scrim.hidden) {
      scrim.classList.remove("is-visible");
      window.setTimeout(function () {
        scrim.hidden = true;
      }, 280);
    }
    document.body.style.overflow = "";
    if (wasOpen && menuToggle && isMobileNav()) {
      menuToggle.focus({ preventScroll: true });
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      if (sidebar && sidebar.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (menuClose) {
    menuClose.addEventListener("click", closeMenu);
  }

  if (scrim) {
    scrim.addEventListener("click", closeMenu);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (!isMobileNav()) {
      closeMenu();
    }
  });

  var navLinks = document.querySelectorAll("[data-nav]");
  var linkById = {};
  var linkIndex;
  for (linkIndex = 0; linkIndex < navLinks.length; linkIndex += 1) {
    var href = navLinks[linkIndex].getAttribute("href");
    if (href && href.charAt(0) === "#") {
      linkById[href.slice(1)] = navLinks[linkIndex];
    }
    navLinks[linkIndex].addEventListener("click", function () {
      if (isMobileNav()) {
        closeMenu();
      }
    });
  }

  function setActive(id) {
    Object.keys(linkById).forEach(function (key) {
      var link = linkById[key];
      var active = key === id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

  function updateScrollSpy() {
    if (!sections.length) {
      return;
    }
    var marker = window.innerHeight * 0.35;
    var currentId = sections[0].id;
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= marker) {
        currentId = section.id;
      }
    });
    setActive(currentId);
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateScrollSpy();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  updateScrollSpy();

  var carousels = document.querySelectorAll("[data-carousel]");
  Array.prototype.forEach.call(carousels, function (carousel) {
    var track = carousel.querySelector("[data-track]");
    if (!track) {
      return;
    }
    var cards = Array.prototype.slice.call(track.children);
    if (!cards.length) {
      return;
    }
    var prevButton = carousel.querySelector("[data-prev]");
    var nextButton = carousel.querySelector("[data-next]");
    var dotsWrap = carousel.querySelector("[data-dots]");

    function step() {
      if (cards.length < 2) {
        return track.clientWidth;
      }
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }

    function maxScroll() {
      return track.scrollWidth - track.clientWidth;
    }

    function updateControls() {
      var left = track.scrollLeft;
      if (prevButton) {
        prevButton.disabled = left <= 2;
      }
      if (nextButton) {
        nextButton.disabled = left >= maxScroll() - 2;
      }
      if (dotsWrap) {
        var offset = step();
        var index = offset > 0 ? Math.round(left / offset) : 0;
        Array.prototype.forEach.call(dotsWrap.children, function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
        });
      }
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      cards.forEach(function (card, cardIndex) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Go to project " + (cardIndex + 1));
        if (cardIndex === 0) {
          dot.classList.add("is-active");
        }
        dot.addEventListener("click", function () {
          track.scrollTo({
            left: cards[cardIndex].offsetLeft - cards[0].offsetLeft,
            behavior: "smooth"
          });
        });
        dotsWrap.appendChild(dot);
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        track.scrollBy({ left: -step(), behavior: "smooth" });
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        track.scrollBy({ left: step(), behavior: "smooth" });
      });
    }

    track.addEventListener(
      "scroll",
      function () {
        window.requestAnimationFrame(updateControls);
      },
      { passive: true }
    );
    window.addEventListener("resize", updateControls);
    updateControls();
  });

  var form = document.getElementById("contactForm");
  if (form) {
    var status = document.getElementById("formStatus");
    var contactEmail = "villalonlester24@gmail.com";

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameField = document.getElementById("name");
      var emailField = document.getElementById("email");
      var subjectField = document.getElementById("subject");
      var messageField = document.getElementById("message");

      var name = nameField ? nameField.value.trim() : "";
      var email = emailField ? emailField.value.trim() : "";
      var subject = subjectField ? subjectField.value.trim() : "";
      var message = messageField ? messageField.value.trim() : "";

      function fail(text) {
        if (status) {
          status.textContent = text;
          status.classList.add("is-error");
        }
      }

      if (!name || !email || !message) {
        fail("Please complete your name, email, and message before sending.");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fail("Please enter a valid email address.");
        return;
      }

      var mailSubject = subject || "New enquiry from " + name;
      var mailBody = "Name: " + name + "\nEmail: " + email + "\n\n" + message;
      var mailto = "mailto:" + contactEmail + "?subject=" + encodeURIComponent(mailSubject) + "&body=" + encodeURIComponent(mailBody);

      window.location.href = mailto;
      if (status) {
        status.classList.remove("is-error");
        status.textContent = "Opening your email app… If nothing happens, email " + contactEmail + " directly.";
      }
      form.reset();
    });
  }
})();
