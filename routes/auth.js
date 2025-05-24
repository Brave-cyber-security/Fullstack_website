// Authentication middleware
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next()
  }
  res.redirect("/login")
}

// Admin middleware
export const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && (req.session.user.isAdmin || req.session.user.isMaster)) {
    return next()
  }
  res.status(403).render("error", { error: "Access denied. Admin privileges required." })
}

// Master middleware
export const isMaster = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isMaster) {
    return next()
  }
  res.status(403).render("error", { error: "Access denied. Master privileges required." })
}
