// ===============================
// VORTEX GAMING - JavaScript
// ===============================

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const toast = document.getElementById("toast");

// Mobile Menu
menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");

    if (mobileMenu.classList.contains("open")) {
        menuBtn.textContent = "✕";
    } else {
        menuBtn.textContent = "☰";
    }
});

// Close mobile menu after clicking a link
document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        menuBtn.textContent = "☰";
    });
});


// ===============================
// Toast Message
// ===============================

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// ===============================
// Game Buttons
// ===============================

const gameButtons = document.querySelectorAll(".game-bottom button");

gameButtons.forEach(button => {
    button.addEventListener("click", () => {
        const gameName =
            button.closest(".game-card")
            .querySelector("h3")
            .textContent;

        showToast(`🎮 ورود به ${gameName} به‌زودی فعال می‌شود!`);
    });
});


// ===============================
// Login Buttons
// ===============================

const loginButtons = document.querySelectorAll(".login-btn");

loginButtons.forEach(button => {
    button.addEventListener("click", () => {
        showToast("🔐 سیستم ورود و ثبت‌نام به‌زودی فعال می‌شود!");
    });
});


// ===============================
// CTA Button
// ===============================

const ctaButton = document.querySelector(".cta-btn");

ctaButton.addEventListener("click", () => {
    showToast("🚀 آماده‌ای؟ به‌زودی شروع می‌کنیم!");
});


// ===============================
// Scroll Reveal Animation
// ===============================

const revealElements = document.querySelectorAll(
    ".game-card, .feature-card, .section-title, .cta-content"
);

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";

                observer.unobserve(entry.target);
            }

        });
    },
    {
        threshold: 0.15
    }
);

revealElements.forEach(element => {

    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";
    element.style.transition = "opacity 0.7s ease, transform 0.7s ease";

    observer.observe(element);
});


// ===============================
// Active Navbar Link
// ===============================

const sections = document.querySelectorAll("main section");
const navLinks = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;

        if (window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight) {

            current = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
});


// ===============================
// Mouse Glow Effect
// ===============================

document.addEventListener("mousemove", (event) => {

    const x = event.clientX;
    const y = event.clientY;

    document.documentElement.style.setProperty(
        "--mouse-x",
        `${x}px`
    );

    document.documentElement.style.setProperty(
        "--mouse-y",
        `${y}px`
    );
});


// ===============================
// Console
// ===============================

console.log(
    "%c VORTEX GAMING ",
    "color:#b56cff;font-size:20px;font-weight:bold;"
);

console.log(
    "%c Welcome, Gamer! 🎮",
    "color:#ffffff;font-size:14px;"
);