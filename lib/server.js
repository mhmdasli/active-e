var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var port = process.env.PORT || 4000;
var App = express();
var https = require('https')
var fs = require('fs');

var logger = require('./helpers').logger();
var { Env } = require("./env")
const { Encryptor } = require("./encryptor");
const helpers = require("./helpers")
var accessLogStream = fs.createWriteStream(path.join(__dirname, '../access.log'), { flags: 'a' })
App.use(morgan('combined', { stream: accessLogStream }))
App.use(express.json());
App.use(express.urlencoded({ extended: false }));
App.use(cookieParser());

App.get("/", function (req, res) {
    var ip = req.ip
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.connection.socket.remoteAddress;
    if (ip == "127.0.0.1") {
        res.sendFile('index.html', { root: path.join(__dirname, '../public') })
    } else {
        helpers.get_devices(devices => {
            
            let device = null;
            devices.forEach(element => {
                if(element.ip == ip) device = element
            });
            if (Env.select(device.mac)!= undefined) { res.sendFile('index.html', { root: path.join(__dirname, '../public') }) }
            else {
                res.send('not allowed!')

                res.end(); // exit if it is a black listed ip
            }
        })
    }

});


App.use(express.static(path.join(__dirname, '../public')));



const options = {
    key: fs.readFileSync(path.join(__dirname, '../ssl/selfsigned.key')),
    cert: fs.readFileSync(path.join(__dirname, '../ssl/selfsigned.crt'))
};
const httpsServer = https.createServer(options, App);
const io = require('socket.io')(httpsServer);
function serve(calback) {
    try {
        httpsServer.listen(port, '0.0.0.0');
        logger.debug("server is running at https://localhost:" + port);
        io.on('connection', client => {
            client.join(client.id)
            client.on('disconnect', () => {
                client.leave(client.id)
            });
            client.on('get_folder', function (path) {
                io.to(client.id).emit('get_folder', { path: path, elements: fs.readdirSync(Env.select("ENCRYPTION_PATH") + path) });
            });
            client.on("get_file_stat", function (path) {
                io.to(client.id).emit('get_file_stat', { path: path, elements: fs.statSync(Env.select("ENCRYPTION_PATH") + path) });
            })

            client.on("delete_folder", function (path) {
                if (fs.lstatSync(Env.select("ENCRYPTION_PATH") + path).isDirectory())
                    fs.rmdirSync(Env.select("ENCRYPTION_PATH") + path, { recursive: true });
                else
                    fs.unlinkSync(Env.select("ENCRYPTION_PATH") + path);
            })
            client.on("download_file", function (path) {
                let encrypted_file = fs.readFileSync(Env.select("ENCRYPTION_PATH") + path)
                let encryptor = new Encryptor()
                let decrypted_file = encryptor.decrypt(encrypted_file);
                io.to(client.id).emit('download_file', { path: path, elements: decrypted_file });
            })
            client.on("preview_file", function (path) {
                fs.readFile(Env.select("ENCRYPTION_PATH") + path, (err, encrypted_file) => {
                    let encryptor = new Encryptor()
                    let decrypted_file = encryptor.decrypt(encrypted_file);
                    io.to(client.id).emit('preview_file', { path: path, elements: decrypted_file });
                })
            })
            client.on("add_folder", function (path) {
                if (!fs.existsSync(Env.select("ENCRYPTION_PATH") + path)) {
                    fs.mkdirSync(Env.select("ENCRYPTION_PATH") + path);
                }
            })
            client.on("save_file", function (data) {
                fs.writeFileSync(Env.select("ENCRYPTION_PATH") + data.path, data.file);
            })
        });
        logger.debug("io server is running at wss://localhost");
    } catch (err) { logger.error(err) }
}
module.exports = { start: serve, http: httpsServer, io: io }
