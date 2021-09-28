const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { pool } = require('./config')


const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())


const login = (request, response, next) => {
    const {usuario, senha} = request.body

    pool.query('SELECT * FROM usuarios where nomeusuario = $1 and senha = $2', 
    [usuario, senha], (err, results) =>{
        if(err || results.rowCounts == 0){
            return response.status(401).json({auth: false , message: 'Usuário ou senha inválido'});
        }

        const nome_usuario = results.rows[0].usuario;
        const token = jwt.sign( { nome_usuario }, process.env.SECRET, {
            expiresIn: 300
        })
        return response.json({auth: true , token: token});
    })
}

const getCigarros = (request, response) => {
    pool.query('SELECT * FROM cigarros', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const addCigarro = (request, response) => {
    const { marca, sabor, preco } = request.body

    pool.query(
        'INSERT INTO cigarros (marca, sabor, preco) VALUES ($1, $2, $3)',
        [marca, sabor, preco],
        (error) => {
            if (error) {
                console.log(error)
                throw error
            }
            response.status(201).json({ status: 'success', message: 'Cigarro adicionado.' })
        },
    )
}

const updateCigarro = (request, response) => {
    const { codigo, marca, sabor, preco } = request.body
    pool.query('UPDATE cigarros set marca=$1, sabor=$2, preco=$3 where codigo=$4',
        [marca, sabor, preco, codigo], error => {
            if (error) {
                console.log(error)
                throw error
            }
            response.status(201).json({ status: 'success', message: 'Cigarro atualizado.' })
        })
}

const deleteCigarro = (request, response, next) => {
    const codigo = parseInt(request.params.id)
    pool.query(
        'DELETE from cigarros where codigo=$1',
        [codigo],
        (error, results) => {
            if (error || results.rowCount == 0) {
                return response.status(401).json({
                    status: 'error',
                    message: 'Não foi possivel remover o cigarro'
                });
            }
            response.status(201).json({
                status: 'success',
                message: 'Cigarro removido com sucesso'
            })
        },
    )
}

const getCigarroPorID = (request, response) => {
    const codigo = parseInt(request.params.id)
    pool.query('SELECT * FROM cigarros where codigo = $1',
        [codigo], (error, results) => {
            if (error || results.rowCount == 0) {
                return response.status(401).json({
                    status: 'error',
                    message: 'Não foi possivel recuperar o cigarro'
                });
            }
            response.status(200).json(results.rows)
        })
}


    app
        .route("/login")
        .post(login)

    app
        .route('/cigarros')
        // GET endpoint
        .get(getCigarros)
        // POST endpoint
        .post(addCigarro)
        // PUT
        .put(updateCigarro)

    app.route('/cigarros/:id')
        .get(getCigarroPorID) // chamada na url assim http://localhost:3002/produtos/2

        .delete(deleteCigarro) // para delete é só chamar pelo método delete http://localhost:3002/produtos/2 2 é um código no BD

    // Start server
    app.listen(process.env.PORT || 3001, () => {
        console.log(`Servidor rodando`)
    })