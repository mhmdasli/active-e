var network = require('network');
const find = require('local-devices');
const mac = require('getmac').default;
const internalIp = require('internal-ip');
const publicIp = require('public-ip');

function logger() {
    var log4js = require('log4js');
    // prepare logger
    log4js.configure({
        appenders: {
            root: {
                type: 'file',
                filename: 'log.log',
                layout: {
                    type: 'pattern',
                    pattern: '%d [%p] pid[%z] %f:%l %n%m%n',
                },
            }
        },
        categories: {
            default: {
                enableCallStack: true,
                appenders: ['root'],
                level: 'all',
            }
        }

    });
    return log4js.getLogger();
}

function get_mac() {
    local_mac = mac.replace(/:/g,"")
    return local_mac.toLowerCase();
}

function get_ipv4() {
    return internalIp.v4.sync();
}
function get_ipv6() {
    return internalIp.v6.sync();
}

function get_public_ipv4() {
    return publicIp.v4();
}
function get_public_ipv6() {
    return publicIp.v6();
}

function get_active_interface(callback) {
    return network.get_active_interface(function (err, obj) {
        obj.mac_address = obj.mac_address.toLowerCase()
        callback(err, obj)
    })
}

function get_devices(callback) {
    find().then(hosts => {
        hosts.forEach(function (val,key) {
            hosts[key].mac = val.mac.replace(/:/g,"")
        })
        callback(hosts)
    }).catch(err => logger().error(err));
}
module.exports = {
    logger: logger,
    get_mac: get_mac,
    get_active_interface: get_active_interface,
    get_devices: get_devices,
    get_public_ipv4: get_public_ipv4,
    get_public_ipv6: get_public_ipv6,
    get_ipv4: get_ipv4,
    get_ipv6: get_ipv6,
}