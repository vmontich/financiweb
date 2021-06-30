/* Módulos */
const express = require("express")
const handlebars = require("express-handlebars")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const app = express()
const admin = require("./routes/admin/admin")
const usuario = require("./routes/usuario/usuario")
const path = require("path")
const session = require("express-session")
const flash = require("connect-flash")
const passport = require("passport")
require("./config/auth")(passport)
const {controleUser} = require("./helpers/controleAcessos")

/* Configurações */
// Session
app.use(session({
    secret: "F1n4nc1Web@",
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
// Flash
app.use(flash())
// Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null
    next()
})
// body-parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use (bodyParser.json())
// express-handlebars
app.engine("handlebars", handlebars({ defaultLayout: "main"}))
app.set("view engine", "handlebars")
// Mongoose
mongoose.Promise = global.Promise
//mongoose.connect("mongodb://localhost/financiweb-prd", {
//mongoose.connect("mongodb://localhost/financiweb-hmg", {
mongoose.connect("mongodb://localhost/financiweb-dsv", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Servidor conectado ao MongoDB...")
}).catch((err) => {
    console.log("Ocorreu um erro ao se conectar ao MongoDB.\n"+err)
})
// Public
app.use(express.static(path.join(__dirname, "public")))

/* Rotas */
app.use("/admin", admin)
app.use("/usuario", usuario)

app.get("/login", (req, res) => {
    res.render("usuario/login")
})

app.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/usuario/",
        failureRedirect: "/login",
        failureFlash: true
    })(req, res, next)
})

app.get("/logout", (req, res) => {
    req.logout()
    req.flash("success_msg", "Logout efetuado com sucesso")
    res.redirect("/login")
})

app.get("/index", controleUser, (req, res) => {
    res.send("PÁGINA INICIAL DO SISTEMA")
})

/* Outros */
const PORT = 8081
app.listen(PORT, () => {
    console.log(`Servidor inciado na porta ${PORT}...`)
})