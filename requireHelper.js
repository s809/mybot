module.exports = path => {
    let map = new Map();

    for (let file of require('fs').readdirSync(path, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name)) {
        let commandDef = require(path + '/' + file);
        map.set(commandDef.name, commandDef);
    }

    return map;
}
