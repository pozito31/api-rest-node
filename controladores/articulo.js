const fs = require("fs");
const path = require("path");
const { validarArticulo } = require("../helpers/validar");
const Articulo = require("../modelos/Articulo");

const prueba = (req, res) => {

    return res.status(200).json({
        mensaje: "Soy una acción de prueba en mi controlador de artículos"
    });
}

const curso = (req, res) => {

    console.log("Se ha ejecutado el endpoint probando");

    return res.status(200).json([{
        curso: "Master en React",
        autor: "Víctor Robles WEB",
        url: "victorroblesweb.es/master-react"
    },
    {
        curso: "Master en React",
        autor: "Víctor Robles WEB",
        url: "victorroblesweb.es/master-react"
    },
    ]);

};

const crear = (req, res) => {

    // Recoger parametros por post a guardar
    let parametros = req.body;

    // Validar datos
    try {
        validarArticulo(parametros);

    } catch (error) {
        return res.status(400).json({
            status: "error",
            mensaje: "Faltan datos por enviar"
        });
    }

    // Crear el objeto a guardar
    const articulo = new Articulo(parametros);

    // Asignar valores a objeto basado en el modelo (manual o automatico)
    //articulo.titulo = parametros.titulo;

    // Guardar el articulo en la base de datos
    articulo.save((error, articuloGuardado) => {

        if (error || !articuloGuardado) {
            return res.status(400).json({
                status: "error",
                mensaje: "No se ha guardado el artículo"
            });
        }

        // Devolver resultado
        return res.status(200).json({
            status: "success",
            articulo: articuloGuardado,
            mensaje: "Articulo creado con exito!!"
        })

    });

}

const listar = (req, res) => {

    let consulta = Articulo.find({});

    if (req.params.ultimos) {
        consulta.limit(3);
    }

    consulta.sort({ fecha: -1 })
        .exec((error, articulos) => {

            if (error || !articulos) {
                return res.status(404).json({
                    status: "error",
                    mensaje: "No se han encontrado artículos!!"
                });
            }

            return res.status(200).send({
                status: "success",
                contador: articulos.length,
                articulos
            });

        });

}

const uno = (req, res) => {
    // Recoger un id por la url
    let id = req.params.id;

    // Buscar el articulo
    Articulo.findById(id, (error, articulo) => {

        // Si no existe devolver error
        if (error || !articulo) {
            return res.status(404).json({
                status: "error",
                mensaje: "No se han encontrado el artículo"
            });
        }

        // Devolver resultado
        return res.status(200).json({
            status: "success",
            articulo
        });

    });
}

const borrar = (req, res) => {

    let articuloId = req.params.id;

    Articulo.findOneAndDelete({ _id: articuloId }, (error, articuloBorrado) => {

        if (error || !articuloBorrado) {
            return res.status(500).json({
                status: "error",
                mensaje: "Error al borrar el articulo"
            });
        }

        return res.status(200).json({
            status: "success",
            articulo: articuloBorrado,
            mensaje: "Metodo de borrar"
        });

    });

}

const editar = (req, res) => {
    // Recorger id articulo a editar
    let articuloId = req.params.id;

    // Recoger datos del body
    let parametros = req.body;

    // Validar datos
    try {
        validarArticulo(parametros);

    } catch (error) {
        return res.status(400).json({
            status: "error",
            mensaje: "Faltan datos por enviar"
        });
    }

    // Buscar y actualizar articulo
    Articulo.findOneAndUpdate({ _id: articuloId }, req.body, { new: true }, (error, articuloActualizado) => {

        if (error || !articuloActualizado) {
            return res.status(500).json({
                status: "error",
                mensaje: "Error al actualizar"
            });
        }

        // Devolver respuesta
        return res.status(200).json({
            status: "success",
            articulo: articuloActualizado
        })
    });

}

const subir = (req, res) => {

    // Configurar multer

    // Recoger el fichero de imagen subido
    if (!req.file && !req.files) {
        return res.status(404).json({
            status: "error",
            mensaje: "Petición invalida"
        });
    }

    // Nombre del archivo
    let archivo = req.file.originalname;

    // Extension del archivo
    let archivo_split = archivo.split("\.");
    let extension = archivo_split[1];

    // Comprobar extension correcta
    if (extension != "png" && extension != "jpg" &&
        extension != "jpeg" && extension != "gif") {

        // Borrar archivo y dar respuesta
        fs.unlink(req.file.path, (error) => {
            return res.status(400).json({
                status: "error",
                mensaje: "Imagen invalida"
            });
        })
    } else {

        // Recorger id articulo a editar
        let articuloId = req.params.id;

        // Buscar y actualizar articulo
        Articulo.findOneAndUpdate({ _id: articuloId }, {imagen: req.file.filename}, { new: true }, (error, articuloActualizado) => {

            if (error || !articuloActualizado) {
                return res.status(500).json({
                    status: "error",
                    mensaje: "Error al actualizar"
                });
            }

            // Devolver respuesta
            return res.status(200).json({
                status: "success",
                articulo: articuloActualizado,
                fichero: req.file
            })
        });

    }

}

const imagen = (req, res) => {
    let fichero = req.params.fichero;
    let ruta_fisica = "./imagenes/articulos/"+fichero;

    fs.stat(ruta_fisica, (error, existe) => {
        if(existe) {
            return res.sendFile(path.resolve(ruta_fisica));
        }else{
            return res.status(404).json({
                status: "error",
                mensaje: "La imagen no existe",
                existe,
                fichero,
                ruta_fisica
            });
        }
    })
}

const buscador = (req, res) => {
    // Sacar el string de busqueda
    let busqueda = req.params.busqueda;

    // Find OR 
    Articulo.find({ "$or": [
        { "titulo": { "$regex": busqueda, "$options": "i"}},
        { "contenido": { "$regex": busqueda, "$options": "i"}},
    ]})
    .sort({fecha: -1})
    .exec((error, articulosEncontrados) => {

        if(error || !articulosEncontrados || articulosEncontrados.length <= 0){
            return res.status(404).json({
                status: "error",
                mensaje: "No se han encontrado artículos"
            });
        }


        return res.status(200).json({
            status: "success",
            articulos: articulosEncontrados
        })
    });
}

module.exports = {
    prueba,
    curso,
    crear,
    listar,
    uno,
    borrar,
    editar,
    subir,
    imagen,
    buscador
}