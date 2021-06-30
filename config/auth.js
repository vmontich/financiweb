const localStartegy = require("passport-local").Strategy
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("../models/Usuario")
const Usuario = mongoose.model("usuario")



module.exports = function(passport) {
    passport.use(new localStartegy({ usernameField: 'username' }, (username, password, done) => {
        Usuario.findOne({ username: username }).then((usuario) => {
            if(!usuario) {
                return done(null, false, {message: "Esta conta não existe"})
            }
            bcrypt.compare(password, usuario.password, (erro, match) => {
                if(match) {
                    return done(null, usuario)
                } else {
                    return done(null, false,{message: "Senha Incorreta"})
                }
            })
        })
    }))

    passport.serializeUser((usuario, done) => {
        done(null, usuario.id)
    })

    passport.deserializeUser((id, done) => {
        Usuario.findById(id, (err, usuario) => {
            done(err, usuario)
        })
    })
}