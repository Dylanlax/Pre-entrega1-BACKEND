import express from "express";
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos

const app = express();
const PORT = 8080;

let nextProductId = 1;



app.use(express.json());

// Rutas para los productos
const productsRouter = express.Router();

// Obtener todos los productos
productsRouter.get('/', async (req, res) => {
    try {
        const data = await fs.promises.readFile('productos.json', 'utf-8');
        const productos = JSON.parse(data);
        const limit = req.query.limit;
        let result = limit ? productos.slice(0, limit) : productos;
        res.json(result);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener un producto por ID
productsRouter.get('/:pid', async (req, res) => {
    const productId = req.params.pid;
    try {
        const data = await fs.promises.readFile('productos.json', 'utf-8');
        const productos = JSON.parse(data);
        const producto = productos.find(producto => producto.id === productId);
        if (producto) {
            res.json(producto);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener producto por id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Agregar un nuevo producto
productsRouter.post('/', async (req, res) => {
    const { title, description, code, price, stock, category, thumbnails } = req.body;

    try {
        const data = await fs.promises.readFile('productos.json', 'utf-8');
        const productos = JSON.parse(data);

        // Encontrar el máximo ID existente
        let maxId = 0;
        for (const producto of productos) {
            if (producto.id > maxId) {
                maxId = producto.id;
            }
        }

        
        const newProductId = maxId + 1;

        // Crear el nuevo producto
        const newProduct = {
            id: newProductId,
            title,
            description,
            code,
            price,
            status: true,
            stock,
            category,
            thumbnails
        };

        // Agregar el nuevo producto al arreglo de productos
        productos.push(newProduct);

        // Escribir el archivo actualizado
        await fs.promises.writeFile('productos.json', JSON.stringify(productos, null, 2));

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// Actualizar un producto por ID
productsRouter.put('/:pid', async (req, res) => {
    const productId = req.params.pid;
    const updatedFields = req.body;
    try {
        let data = await fs.promises.readFile('productos.json', 'utf-8');
        let productos = JSON.parse(data);
        const index = productos.findIndex(producto => producto.id === productId);
        if (index !== -1) {
            productos[index] = { ...productos[index], ...updatedFields };
            await fs.promises.writeFile('productos.json', JSON.stringify(productos, null, 2));
            res.json(productos[index]);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar un producto por ID
productsRouter.delete('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid); // Convertir el ID del producto a número
    try {
        let data = await fs.promises.readFile('productos.json', 'utf-8');
        let productos = JSON.parse(data);
        const index = productos.findIndex(producto => producto.id === productId);
        if (index !== -1) {
            productos.splice(index, 1);
            await fs.promises.writeFile('productos.json', JSON.stringify(productos, null, 2));
            res.json({ message: 'Producto eliminado correctamente' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Registrar el enrutador de productos
app.use('/api/products', productsRouter);

// Rutas para los carritos
const cartsRouter = express.Router();

// Obtener todos los carritos
cartsRouter.get('/', async (req, res) => {
    try {
        const data = await fs.promises.readFile('carrito.json', 'utf-8');
        const carritos = JSON.parse(data);
        res.json(carritos);
    } catch (error) {
        console.error('Error al obtener carritos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear un nuevo carrito
cartsRouter.post('/', async (req, res) => {
    const newCart = {
        id: uuidv4(), // Generar un ID único para el carrito
        products: [] // Inicializar la lista de productos vacía
    };
    try {
        const data = await fs.promises.readFile('carrito.json', 'utf-8');
        const carritos = JSON.parse(data);
        carritos.push(newCart);
        await fs.promises.writeFile('carrito.json', JSON.stringify(carritos, null, 2));
        res.status(201).json(newCart);
    } catch (error) {
        console.error('Error al crear carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener productos de un carrito por ID de carrito
cartsRouter.get('/:cid', async (req, res) => {
    const cartId = req.params.cid;
    try {
        const data = await fs.promises.readFile('carrito.json', 'utf-8');
        const carritos = JSON.parse(data);
        const cart = carritos.find(cart => cart.id === cartId);
        if (cart) {
            res.json(cart.products);
        } else {
            res.status(404).json({ error: 'Carrito no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener productos del carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Agregar un producto a un carrito por ID de carrito
cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;

    try {
        // Leer el contenido de los productos desde el archivo productos.json
        const productosData = await fs.promises.readFile('productos.json', 'utf-8');
        const productos = JSON.parse(productosData);

        // Verificar si el producto existe
        const productExists = productos.some(product => String(product.id) === productId);

        if (!productExists) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Leer el contenido del carrito desde el archivo carrito.json
        const carritosData = await fs.promises.readFile('carrito.json', 'utf-8');
        const carritos = JSON.parse(carritosData);

        // Buscar el carrito por su ID
        const cartIndex = carritos.findIndex(cart => cart.id === cartId);

        if (cartIndex !== -1) {
            // Carrito encontrado, buscar el producto por su ID en el carrito
            const productIndex = carritos[cartIndex].products.findIndex(product => product.id === productId);

            if (productIndex !== -1) {
                // Si el producto ya está en el carrito, incrementar la cantidad
                carritos[cartIndex].products[productIndex].quantity++;
            } else {
                // Si el producto no está en el carrito, agregarlo con cantidad 1
                carritos[cartIndex].products.push({ id: productId, quantity: 1 });
            }

            // Escribir el archivo actualizado
            await fs.promises.writeFile('carrito.json', JSON.stringify(carritos, null, 2));
            res.json({ message: 'Producto agregado al carrito correctamente' });
        } else {
            // Carrito no encontrado, devolver un error
            res.status(404).json({ error: 'Carrito no encontrado' });
        }
    } catch (error) {
        console.error('Error al agregar producto al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Registrar el enrutador de carritos
app.use('/api/carts', cartsRouter);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});