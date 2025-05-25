// Test script to verify admin navigation consistency
// This would be run in a browser console or as part of automated testing

const adminNavigationTest = {
  // Test all admin sidebar links
  testSidebarLinks: () => {
    const sidebarLinks = [
      { url: "/admin/dashboard", page: "dashboard", title: "Dashboard" },
      { url: "/admin/support", page: "support", title: "Support Requests" },
      { url: "/admin/customers", page: "customers", title: "Customers" },
      { url: "/admin/parts", page: "parts", title: "Spare Parts" },
      { url: "/admin/analytics", page: "analytics", title: "Analytics" },
      { url: "/knowledge/admin", page: "knowledge", title: "Knowledge Base" },
    ]

    console.log("Testing Admin Sidebar Navigation...")

    sidebarLinks.forEach((link) => {
      console.log(`Testing: ${link.title} (${link.url})`)

      // Check if link exists in sidebar
      const sidebarLink = document.querySelector(`a[href="${link.url}"]`)
      if (sidebarLink) {
        console.log(`✅ ${link.title} link found in sidebar`)

        // Check if current page has active class when appropriate
        if (window.location.pathname === link.url) {
          if (sidebarLink.classList.contains("active")) {
            console.log(`✅ ${link.title} has active state`)
          } else {
            console.log(`❌ ${link.title} missing active state`)
          }
        }
      } else {
        console.log(`❌ ${link.title} link not found in sidebar`)
      }
    })
  },

  // Test page structure consistency
  testPageStructure: () => {
    console.log("Testing Page Structure...")

    // Check for admin header
    const adminHeader = document.querySelector(".admin-header")
    if (adminHeader) {
      console.log("✅ Admin header found")
    } else {
      console.log("❌ Admin header missing")
    }

    // Check for admin sidebar
    const adminSidebar = document.querySelector(".admin-sidebar")
    if (adminSidebar) {
      console.log("✅ Admin sidebar found")
    } else {
      console.log("❌ Admin sidebar missing")
    }

    // Check for main content area
    const adminMain = document.querySelector(".admin-main")
    if (adminMain) {
      console.log("✅ Admin main content area found")
    } else {
      console.log("❌ Admin main content area missing")
    }

    // Check for dashboard content wrapper
    const dashboardContent = document.querySelector(".dashboard-content")
    if (dashboardContent) {
      console.log("✅ Dashboard content wrapper found")
    } else {
      console.log("❌ Dashboard content wrapper missing")
    }

    // Check for admin footer
    const adminFooter = document.querySelector(".admin-footer")
    if (adminFooter) {
      console.log("✅ Admin footer found")
    } else {
      console.log("❌ Admin footer missing")
    }
  },

  // Test responsive behavior
  testResponsive: () => {
    console.log("Testing Responsive Behavior...")

    const sidebar = document.querySelector(".admin-sidebar")
    const main = document.querySelector(".admin-main")

    if (window.innerWidth <= 768) {
      console.log("Mobile view detected")
      // Test mobile sidebar behavior
    } else {
      console.log("Desktop view detected")
      // Test desktop sidebar behavior
    }
  },

  // Run all tests
  runAllTests: function () {
    this.testSidebarLinks()
    this.testPageStructure()
    this.testResponsive()
    console.log("Admin navigation testing complete!")
  },
}

// Auto-run tests when script loads
if (typeof window !== "undefined") {
  adminNavigationTest.runAllTests()
}
