# Active-E
This project was generated with npm & express & electron. targeted for linux-debian | mac | windows desktop server.

### start dev
`npm start`
### create package
`npm run packager-linux`
or
`npm run packager-win`
### create installer
`npm run installer-linux`
or
`npm run installer-win`
### generate ssl
create a self-signed key and certificate pair with OpenSSL in a single command by typing:
```
sudo mkdir -p ssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/selfsigned.key -out ssl/selfsigned.crt
```
While we are using OpenSSL, we should also create a strong Diffie-Hellman group, which is used in negotiating Perfect Forward Secrecy with clients.

We can do this by typing:
```
sudo openssl dhparam -out ssl/dhparam.pem 2048
```

### Folder Structure
```
|--usr/src/crossprint/reverseproxy
   |-- app\             # Desktop app 
   |-- lib\             # source utils
   |-- ssl\             # openssl certificates and keys 
   |-- public\          # web app
   |-- main.js          # entry point
   |-- .env             # enviroment vars
```