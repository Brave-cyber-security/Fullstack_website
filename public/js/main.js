document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const navLinks = document.querySelector(".nav-links")

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", function () {
      navLinks.classList.toggle("active")
      this.classList.toggle("active")
    })
  }

  // Testimonial slider
  const testimonialSlider = document.querySelector(".testimonial-slider")
  if (testimonialSlider) {
    let currentSlide = 0
    const testimonials = testimonialSlider.querySelectorAll(".testimonial")
    const totalSlides = testimonials.length

    if (totalSlides > 1) {
      // Create navigation dots if they don't exist
      if (!testimonialSlider.querySelector(".slider-dots")) {
        const dotsContainer = document.createElement("div")
        dotsContainer.className = "slider-dots"

        for (let i = 0; i < totalSlides; i++) {
          const dot = document.createElement("button")
          dot.className = "slider-dot"
          dot.setAttribute("aria-label", `Go to slide ${i + 1}`)
          dot.addEventListener("click", () => goToSlide(i))
          dotsContainer.appendChild(dot)
        }

        testimonialSlider.appendChild(dotsContainer)
      }

      // Auto-advance slides
      setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides
        updateSlider()
      }, 5000)

      // Initial setup
      updateSlider()

      function goToSlide(index) {
        currentSlide = index
        updateSlider()
      }

      function updateSlider() {
        // Update testimonials with fade animation
        testimonials.forEach((testimonial, index) => {
          testimonial.style.display = "none"
          testimonial.style.opacity = "0"

          if (index === currentSlide) {
            testimonial.style.display = "block"
            // Trigger reflow
            testimonial.offsetWidth
            testimonial.style.opacity = "1"
            testimonial.style.transition = "opacity 0.5s ease"
          }
        })

        // Update dots
        const dots = testimonialSlider.querySelectorAll(".slider-dots .slider-dot")
        dots.forEach((dot, index) => {
          dot.classList.toggle("active", index === currentSlide)
        })
      }
    }
  }

  // Form validation
  const forms = document.querySelectorAll("form")
  forms.forEach((form) => {
    if (form.classList.contains("no-validation")) return

    form.addEventListener("submit", (event) => {
      const requiredFields = form.querySelectorAll("[required]")
      let isValid = true

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          isValid = false
          field.classList.add("error")

          // Create or update error message
          let errorMessage = field.nextElementSibling
          if (!errorMessage || !errorMessage.classList.contains("field-error")) {
            errorMessage = document.createElement("div")
            errorMessage.className = "field-error"
            field.parentNode.insertBefore(errorMessage, field.nextSibling)
          }
          errorMessage.textContent = "This field is required"
        } else {
          field.classList.remove("error")
          const errorMessage = field.nextElementSibling
          if (errorMessage && errorMessage.classList.contains("field-error")) {
            errorMessage.remove()
          }
        }
      })

      if (!isValid) {
        event.preventDefault()
      }
    })
  })

  // Show/hide business name field based on account type
  const accountTypeRadios = document.querySelectorAll('input[name="accountType"]')
  const businessNameField = document.getElementById("businessNameField")

  if (accountTypeRadios.length > 0 && businessNameField) {
    function toggleBusinessField() {
      const selectedType = document.querySelector('input[name="accountType"]:checked').value
      businessNameField.style.display = selectedType === "business" ? "block" : "none"
    }

    // Set initial state
    toggleBusinessField()

    // Add change event listeners
    accountTypeRadios.forEach((radio) => {
      radio.addEventListener("change", toggleBusinessField)
    })
  }

  // Animate elements when they come into view
  const animateElements = document.querySelectorAll(".service-card, .step, .testimonial, .stat-card")

  if ("IntersectionObserver" in window && animateElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 },
    )

    animateElements.forEach((el) => {
      observer.observe(el)
    })
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    animateElements.forEach((el) => {
      el.classList.add("fade-in")
    })
  }
})
