const adminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === "super") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin only area.",
    });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (req.admin && roles.includes(req.admin.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `Access denied. ${roles.join(" or ")} role required.`,
      });
    }
  };
};

module.exports = { adminOnly, checkRole };
