module.exports = {
    controleAdmin: function(req, res, next) {
        if(req.isAuthenticated() && req.user.isAdmin == 1) {
            return next()
        }
        req.flash("error_msg", "Apenas administradores podem acessar esta página")
        res.redirect("/usuario/")
    },
    controleUser: function(req, res, next) {
        if(req.isAuthenticated()) {
            return next()
        }
        req.flash("error_msg", "Faça o login para acessar esta página")
        res.redirect("/login")
    }
}