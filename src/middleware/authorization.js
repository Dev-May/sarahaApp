export const authorization = (accessRoles = []) => {
  return (req, res, next) => {
    // Check user role
    if (!req.user || !req.user.role) {
      throw new Error("Forbidden", { cause: 403 });
    }

    // Check if user role is in the allowed roles
    if (!accessRoles.includes(req?.user?.role)) {
      throw new Error("user not authorized", { cause: 401 });
    }

    return next();
  };
};
