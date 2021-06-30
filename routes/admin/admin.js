const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
require("../../models/Categoria")
const Categoria = mongoose.model("categoria")
const {controleAdmin} = require("../../helpers/controleAcessos")

router.get("/", controleAdmin, (req, res) => {
    res.render("admin/index")
})

router.get("/usuarios", /*controleAdmin,*/ (req, res) => {
    res.render("admin/usuarios")
})

router.get("/categorias", controleAdmin, (req, res) => {
    Categoria.find().sort({nome: "asc"}).lean().then((categorias) => {
        res.render("admin/categorias", { categorias: categorias })
    }).catch((err) => {
        req.flash("Houve um erro na listagem das categorias")
        res.redirect("/admin")
    })
})

router.get("/categorias/nova", controleAdmin, (req, res) => {
    res.render("admin/nova-categoria")
})

router.post("/categorias/incluir", controleAdmin, (req, res) => {
    
    const erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Defina um nome válido para a categoria" })
    }
    if(req.body.nome.length < 3) {
        erros.push({ texto: "O nome da categoria deve ter ao menos 3 caracteres" })
    }
    if(erros.length > 0) {
        res.render("../views/admin/nova-categoria", { erros: erros })
    } else {
        const novaCategoria = {
            nome: req.body.nome,
            descricao: req.body.descricao,
            dataCriacao: Date.now()
        }
        new Categoria(novaCategoria).save().then(() => {
            req.flash("success_msg", "Categoria criada com sucesso")
            res.redirect("/admin/categorias")
        }).catch((err) => {
            req.flash("error_msg", "Ocorreu um erro ao salvar a categoria")
            res.redirect("/admin/categorias")
        })
    }
})

router.get("/categorias/editar/:id", controleAdmin, (req, res) => {
    Categoria.findOne({ _id: req.params.id }).lean().then((categoria) => {
        res.render("../views/admin/editar-categoria", { categoria: categoria })
    }).catch((err) => {
        req.flash("error_msg", "Esta categoria não existe")
        res.redirect("/admin/categorias")
    })
    
})

router.post("/categorias/editar", controleAdmin, (req, res) => {
    Categoria.findOne({ _id: req.body.id }).lean().then((categoria) => {
        
        var erros = []

        if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
            erros.push({ texto: "Defina um nome válido para a categoria"})
        }
        if(req.body.nome.length < 3) {
            erros.push({ texto: "O nome da categoria deve ter ao menos 3 caracteres" })
        }
        if(erros.length > 0) {
            res.render("../views/admin/editar-categoria", { erros: erros, categoria: categoria })
        } else {
            categoria.nome = req.body.nome
            categoria.descricao = req.body.descricao

            Categoria.updateOne({_id: req.body.id}, categoria).then(() => {
                req.flash("success_msg", "Categoria alterada com sucesso!")
                res.redirect("/admin/categorias")
            }).catch((err) => {
                req.flash("error_msg", "Ocorreu um erro ao salvar as alterações desta categoria")
                res.redirect("/admin/categorias")
            })
        }
    }).catch((err) => {
        req.flash("error_msg", "Não foi possível encontrar a categoria para alteração")
        res.redirect("/admin/categorias")
    })
})

router.get("/categorias/excluir/:id", controleAdmin, (req, res) => {
    Categoria.remove({ _id: req.params.id }).then(() => {
        req.flash("success_msg", "Categoria removida com sucesso")
        res.redirect("/admin/categorias")
    }).catch((erro) => {
        req.flash("error_msg", "Não foi possível remover a categoria")
        res.redirect("/admin/categorias")
    })
})

module.exports = router