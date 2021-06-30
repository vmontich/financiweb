const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const moment = require("moment")
const currency = require("currency-formatter")
require("../../models/LancamentoFinanceiro")
require("../../models/Categoria")
require("../../models/Usuario")
const Lancamento = mongoose.model("lancamentoFinanceiro")
const Categoria = mongoose.model("categoria")
const Usuario = mongoose.model("usuario")
const bcrypt = require("bcryptjs")
const {controleUser} = require("../../helpers/controleAcessos")
const dataUtils = require("../../utils/dataUtils")

router.get("/", controleUser, (req, res) => {
    res.render("usuario/index")
})

router.get("/lancamentos/:data", controleUser, (req, res) => {
    let mes = null
    let valorTotal = 0
    let date

    if(req.params.data == -1) {
        date = new Date()
    } else {
        date = new Date(req.params.data)
    }
    let dateAnterior = new moment(date).subtract(1, 'months').date(1)
    let dateSeguinte = new moment(date).add(2, 'months').date(0)
    dateAnterior = new Date(dateAnterior)
    dateSeguinte = new Date(dateSeguinte)

    let primeiroDia = new Date(date.getFullYear(), date.getMonth(), 1);
    let ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    mes = parseInt(new Date().getMonth() + 1)
    let periodo = dataUtils.getPeriodo(date)

    Lancamento.find({idUsuario: req.user._id, dataLancamento: { $gte: primeiroDia, $lte: ultimoDia }}).sort({dataLancamento: "asc"}).populate("idCategoria").lean().then((lancamentos) => {
        lancamentos.forEach((lancamento) => {
            lancamento.dataLancamento = moment(lancamento.dataLancamento).format("DD/MM/YYYY")
            if(lancamento.tipoLancamento == "D") {
                lancamento.valor = lancamento.valor * -1
            }
            valorTotal += lancamento.valor
            lancamento.valor = currency.format(lancamento.valor, { code: 'BRL' })
        })
        valorTotal = currency.format(valorTotal, { code: 'BRL' })
        res.render("usuario/lancamentos", { lancamentos: lancamentos, valorTotal: valorTotal, mes: mes, periodo: periodo, dateAnterior: dateAnterior, dateSeguinte: dateSeguinte })
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar os lançamentos do mês")
    })
})

router.get("/lancamento/novo/", controleUser, (req, res) => {
    Categoria.find().sort({nome: "asc"}).lean().then((categorias) => {
        res.render("usuario/novo-lancamento", { categorias: categorias })
    }).catch((err) => {
        req.flash("error_msg", "Ocorreu um erro ao tentar criar um novo lançamento")
        res.redirect("/usuario/lancamentos")
    })
    
})

router.post("/lancamentos/incluir", controleUser, (req, res) => {

    const erros = []

    if(!req.body.valor || typeof req.body.valor == undefined || req.body.valor == null) {
        erros.push({ texto: "O valor do lançamento precisa ser informado" })
    }
    if(req.body.valor == "0") {
        erros.push({ texto: "O valor do lançamento não pode ser zero"})
    }
    if(req.body.tipoLancamento != "R" && req.body.tipoLancamento != "D") {
        erros.push({ texto: "Informe se o lançamento é uma receita ou uma despesa" })
    }
    if(req.body.categoria == "") {
        erros.push({ texto: "Selecione uma categoria para o lançamento" })
    }
    if(req.body.dataLancamento == "" || req.body.dataLancamento.length != 10) {
        erros.push({ texto: "Insira uma data válida para o lançamento" })
    }

    if(erros.length > 0) {
        res.render("usuario/novo-lancamento", { erros: erros })
    } else {
        const mes = new Date(req.body.dataLancamento).getMonth() + 1
        const data = moment(req.body.dataLancamento, "YYYY-MM-DD")
        
        const novoLancamento = {
            descricao: req.body.descricao,
            valor: req.body.valor,
            idCategoria: req.body.categoria,
            dataLancamento: data,
            mesLancamento: mes,
            tipoLancamento: req.body.tipoLancamento,
            idUsuario: req.user._id
        }
        new Lancamento(novoLancamento).save().then(() => {
            req.flash("success_msg", "Lançamento cadastrado com sucesso")
            res.redirect("/usuario/lancamentos/-1")
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar este lançamento:", err)
            res.redirect("/usuario/lancamentos/-1")
        })
    }
})

router.get("/lancamentos/editar/:id", controleUser, controleUser, (req, res) => {

    Lancamento.findOne({ _id: req.params.id }).lean().then((lancamento) => {

        lancamento.dataLancamento = moment(lancamento.dataLancamento).format("YYYY-MM-DD")

        Categoria.find().lean().then((categorias) => {
            res.render("../views/usuario/editar-lancamento", { categorias: categorias, lancamento: lancamento})
        }).catch((err) => {
            req.flash("error_msg", "Ocorreu um erro ao carregar a lista de categorias")
            res.redirect("/usuario/lancamentos/-1")
        })
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar informações do lançamento")
        res.redirect("/usuario/lancamentos/-1")
    })
})

router.post("/lancamentos/editar", controleUser, controleUser, (req, res) => {
    Lancamento.findOne({ _id: req.body.id }).lean().then((lancamento) => {

        const erros = []
        lancamento.dataLancamento = moment(lancamento.dataLancamento).format("YYYY-MM-DD")

        if(!req.body.valor || typeof req.body.valor == undefined || req.body.valor == null) {
            erros.push({ texto: "O valor do lançamento precisa ser informado" })
        }
        if(req.body.valor == "0") {
            erros.push({ texto: "O valor do lançamento não pode ser zero"})
        }
        if(req.body.tipoLancamento != "R" && req.body.tipoLancamento != "D") {
            erros.push({ texto: "Informe se o lançamento é uma receita ou uma despesa" })
        }
        if(req.body.categoria == "") {
            erros.push({ texto: "Selecione uma categoria para o lançamento" })
        }
        if(req.body.dataLancamento == "" || req.body.dataLancamento.length != 10) {
            erros.push({ texto: "Insira uma data válida para o lançamento" })
        }

        if(erros.length > 0) {
            res.render("usuario/editar-lancamento", { erros: erros, lancamento: lancamento })
        } else {
            const mes = new Date(req.body.dataLancamento).getMonth() + 1
            const data = moment(req.body.dataLancamento, "YYYY-MM-DD")
            lancamento.descricao = req.body.descricao
            lancamento.valor = req.body.valor
            lancamento.idCategoria = req.body.categoria
            lancamento.dataLancamento = data
            lancamento.mesLancamento = mes
            lancamento.tipoLancamento = req.body.tipoLancamento
            
            Lancamento.updateOne({_id: req.body.id}, lancamento).then(() => {
                req.flash("success_msg", "Lançamento alterado com sucesso")
                res.redirect("/usuario/lancamentos/-1")
            }).catch((err) => {
                req.flash("error_msg", "Ocorreu um erro ao salvar as alterações deste lançamento")
                res.redirect("/usuario/lancamentos/-1")
            })        
        }
    }).catch((err) => {
        req.flash("error_msg", "Ocorreu um erro ao encontrar o lançamento selecionado")
        console.log(err)
        res.redirect("/usuario/lancamentos/-1")
    })
})

router.get("/lancamentos/excluir/:id", controleUser, (req, res) => {
    Lancamento.remove({ _id: req.params.id }).then(() => {
        req.flash("success_msg", "Lançamento removido com sucesso")
        res.redirect("/usuario/lancamentos/-1")
    }).catch((err) => {
        req.flash("error_msg", "Não foi possível remover o lançamento. Tente novamente")
        res.redirect("/usuario/lancamentos/-1")
    })
})

router.get("/registrar", (req, res) => {
    res.render("usuario/registrar")
})

router.post("/registrar", (req, res) => {
    var erros = []
    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome inválido"})
    }
    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({texto: "Email inválido"})
    }
    if(!req.body.username || typeof req.body.username == undefined || req.body.username == null) {
        erros.push({texto: "Usuário inválido"})
    }
    if(!req.body.password || typeof req.body.password == undefined || req.body.password == null) {
        erros.push({texto: "Senha inválida"})
    }
    if(req.body.password != req.body.password2) {
        erros.push({texto: "As senhas digitadas estão diferentes"})
    }
    if(erros.length > 0) {
        res.render("usuario/registrar", {erros: erros})
    } else {
        Usuario.findOne({username: req.body.username}).lean().then((user) => {
            if(user) {
                req.flash("error_msg", "Este usuário já existe no sistema. Escolha outro.")
                res.redirect("/usuario/registrar")
            } else {
                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    username: req.body.username,
                    password: req.body.password
                    , isAdmin: 1
                })
                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUsuario.password, salt, (erro, hash) => {
                        if(erro) {
                            req.flash("error_msg", "Ocorreu um erro ao encriptar a senha")
                            res.redirect("/")
                        } else {
                            novoUsuario.password = hash
                            novoUsuario.save().then(() => {
                                req.flash("success_msg", "Usuário criado com sucesso")
                                res.redirect("/login")
                            }).catch((err) => {
                                req.flash("error_msg", "Ocorreu um erro ao cadastrar o usuário. Tente novamente")
                                res.redirect("/usuario/registrar")
                            })
                        }
                    })
                })
            }
        }).catch((err) => {
            req.flash("error_msg", "Ocorreu um erro ao buscar usuário. Tente novamente.")
            res.redirect ("/")
        })
    }
})

module.exports = router