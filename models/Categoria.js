const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Categoria = new Schema({
    nome: {
        type: String,
        required: true
    },
    descricao: {
        type: String,
    },
    dataCriacao: {
        type: Date,
        required: true,
        default: Date.now()
    }
})

mongoose.model("categoria", Categoria)