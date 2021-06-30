const mongoose = require("mongoose")
const Schema = mongoose.Schema

const LancamentoFinanceiro = new Schema({
    descricao: {
        type: String,
        required: true
    },
    valor: {
        type: Number,
        required: true
    },
    idCategoria: {
        type: Schema.Types.ObjectId,
        ref: "categoria",
        required: true
    },
    dataLancamento: {
        type: Date,
        required: true
    },
    mesLancamento: {
        type: Number,
        required: true
    },
    tipoLancamento: {
        type: String,
        required: true
    },
    idUsuario: {
        type: Schema.Types.ObjectId,
        ref: "usuario",
        required: true
    }
})

mongoose.model("lancamentoFinanceiro", LancamentoFinanceiro)