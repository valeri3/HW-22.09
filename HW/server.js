var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/news', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/news.html'));
});

app.get('/about', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/about.html'));
});

app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/submit-login', function(req, res) {
    const { login, password } = req.body;

    // Чтение файла с зарегистрированными пользователями
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) throw err;

        const users = JSON.parse(data);
        const user = users.find(u => u.login === login && u.password === password);

        if (user) {
            // Успешный вход
            res.redirect(`/admin?login=${login}`);
        } else {
            // Ошибка авторизации
            res.redirect('/login?message=error');
        }
    });
});

app.get('/register', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.post('/submit-register', function(req, res) {
    const { login, password, confirmPassword, email } = req.body;

    if (password === confirmPassword) {
        const newUser = { login, password, email };

        // Чтение существующих пользователей
        fs.readFile('users.json', 'utf8', (err, data) => {
            if (err) {
                return res.redirect('/register?message=error');
            }

            const users = JSON.parse(data);

            const userExists = users.some(u => u.login === login);
            const emailExists = users.some(u => u.email === email);

            if (userExists) {
                // Пользователь с таким логином уже существует
                res.redirect('/register?message=exists');
            } else if (emailExists) {
                // Пользователь с таким email уже существует
                res.redirect('/register?message=email_exists');
            } else {
                // Добавляем нового пользователя
                users.push(newUser);

                // Записываем обновленный список пользователей в файл
                fs.writeFile('users.json', JSON.stringify(users, null, 2), err => {
                    if (err) throw err;
                    res.redirect('/register?message=success');
                });
            }
        });
    } else {
        // Пароли не совпадают
        res.redirect('/register?message=mismatch');
    }
});

app.get('/admin', function(req, res) {
    const { login } = req.query;
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get('/add', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/add-product.html'));
});

app.post('/submit-add', function(req, res) {
    const { name, price, description } = req.body;

    const filteredPrice = price.replace(/[^0-9.]/g, '');

    const newProduct = { name, price: filteredPrice, description };

    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) throw err;

        const products = JSON.parse(data);
        products.push(newProduct);

        fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
            if (err) throw err;
            res.redirect('/add?message=success');
        });
    });
});

app.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/edit.html'));
});

app.get('/edit-product/:index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/edit-product.html'));
});

app.get('/get-product/:index', (req, res) => {
    const { index } = req.params;
    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Ошибка чтения продуктов');
        const products = JSON.parse(data);
        if (products[index]) {
            res.json(products[index]);
        } else {
            res.status(404).send('Продукт не найден');
        }
    });
});

app.post('/edit-product/:index', (req, res) => {
    const { index } = req.params;
    const { name, price, description } = req.body;

    const filteredPrice = price.replace(/[^0-9.]/g, '');

    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Ошибка чтения продуктов');
        let products = JSON.parse(data);
        products[index] = { name, price: filteredPrice, description };

        fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
            if (err) return res.status(500).send('Ошибка записи продуктов');
            res.send('Продукт обновлён');
        });
    });
});

app.delete('/delete-product/:index', (req, res) => {
    const { index } = req.params;
    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Ошибка чтения продуктов');
        let products = JSON.parse(data);
        if (products[index]) {
            products.splice(index, 1);
            fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
                if (err) return res.status(500).send('Ошибка записи продуктов');
                res.status(200).send('Продукт удалён');
            });
        } else {
            res.status(404).send('Продукт не найден');
        }
    });
});

app.get('/all', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/all.html'));
});

app.get('/all-products', (req, res) => {
    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Ошибка чтения продуктов');
        const products = JSON.parse(data);
        res.json(products);
    });
});

app.use(function(req, res) {
    res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.listen(8080, function() {
    console.log('Server running on port 8080');
});
