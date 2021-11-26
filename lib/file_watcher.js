const chokidar = require('chokidar');
const { Encryptor } = require("./encryptor")
const fs = require("fs")
const { Env } = require('./env');
const logger = require('./helpers').logger();
const io = require("./server").io
var file_queue = []
function watch() {
  try {
    queue_loop()
    if (!fs.existsSync(Env.select("ENCRYPTION_PATH"))) {
      fs.mkdirSync(Env.select("ENCRYPTION_PATH"))
    }
    //add,unlink,change,addDir,unlinkDir
    chokidar.watch(Env.select("ENCRYPTION_PATH")).on('all', (event, path, stats) => {
      file_queue.push({ event: event, path: path, stats: stats })
    });
  } catch (e) {
    logger.error(e);
  }
}
async function queue_loop() {
  if (file_queue.length > 0) {
    let element = file_queue[0]
    file_queue.shift()
    let path = element.path;
    let stats = element.stats;
    let event = element.event;
    if (event === "add" && !path.includes("_encrypted_")) {

      let pieces = path.split(/[\\,]+/)
      let file_name = pieces[pieces.length - 1]
      let new_file_name = Date.now() + "_encrypted_" + file_name

      fs.readFile(path, function (err, data_file) {
        if (err) logger.error(err)
        let encryptor = new Encryptor()
        fs.writeFile(path, encryptor.encrypt(data_file), () => {
          let new_path = path.replace(file_name, new_file_name)
          fs.rename(path, new_path, (err) => { if (err) throw err })
        })
      })
    } else if (event === "add" && path.includes("_encrypted_")) {
      let pieces = path.split(/[\\,]+/)
      let file_name = pieces[pieces.length - 1]
      let added_to = path.replace("\\" + file_name, "");
      added_to = added_to.replace(Env.select("ENCRYPTION_PATH"), "")
      io.emit('add_file', { path: added_to, element: file_name });
    } else if (event == "addDir") {
      let pieces = path.split(/[\\,]+/)
      let dir_name = pieces[pieces.length - 1]
      let added_to = path.replace("\\" + dir_name, "");
      added_to = added_to.replace(Env.select("ENCRYPTION_PATH"), "")
      io.emit('add_file', { path: added_to, element: dir_name });
    } else if (event == "unlink") {
      let pieces = path.split(/[\\,]+/)
      let file_name = pieces[pieces.length - 1]
      io.emit('remove_file', { path: path, element: file_name });
    }
    else if (event == "unlinkDir") {
      let pieces = path.split(/[\\,]+/)
      let dir_name = pieces[pieces.length - 1]
      io.emit('remove_file', { path: path, element: dir_name });
    }
  } else {
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

  }
  queue_loop()
}
module.exports.start = watch