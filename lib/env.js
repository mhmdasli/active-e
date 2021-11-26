const logger  = require('./helpers').logger();
var path = require('path');
const fs =require("fs")
var dotenv = require('dotenv').config({path:path.join(__dirname, '../../.env')})
const readline = require('readline');
class Env{
    constructor(){}
    static select_all(){
        return dotenv.parsed
    }
    static select(key){
        return dotenv.parsed[key]
    }
    static insert(key,val){
        if(dotenv.parsed[key]) return false;
        fs.appendFileSync(path.join(__dirname, '../../.env'),key+"="+val+"\n")
        dotenv.parsed[key] = val;
        process.env[key] = val;
        return true;
    }
    static async delete(key){
        const fileStream = fs.createReadStream(path.join(__dirname, '../../.env'));

        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });
        let data=""
        for await (const line of rl) {

            if(!line.includes(key+"=")){
                data+=line +"\n";
                
            }else{
                delete dotenv.parsed[key];
                delete process.env[key];

            }
            fs.writeFileSync(path.join(__dirname, '../../.env'), data, "utf8");
        }
    }
    static async update(key,val){
        const fileStream = fs.createReadStream(path.join(__dirname, '../../.env'));

        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });
        let data=""
        for await (const line of rl) {
            data+=line +"\n";
            if(line.includes(key+"=")){
                data = data.replace(line, key+"="+val);
                dotenv.parsed[key] = val;
                process.env[key] = val;
            }
            fs.writeFileSync(path.join(__dirname, '../../.env'), data, "utf8");
        }
    }
}
module.exports = {Env}
