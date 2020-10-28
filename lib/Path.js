
/**
* 路径解析器。
*/
define('Path', function (require, module, exports) {
    const path = require('path');

    return exports = {
        /**
        * 进行标准化处理，以得到格式统一的路径。
        */
        normalize(file) {
            let isUrl =
                file.startsWith('http://') ||
                file.startsWith('https://') ||
                file.startsWith('//');                  //这个也是绝对地址。

     
            //以 http:// 等开头的 url，不要处理。
            if (!isUrl) {
                file = file.replace(/\\/g, '/');    //把 '\' 换成 '/'
                file = file.replace(/\/+/g, '/');   //把多个 '/' 合成一个
            }

            file = file.split('#')[0]; //去掉带 hash 部分的。
            file = file.split('?')[0]; //去掉带 query 部分的。

            return file;
        },

        /**
        * 合并多个路径，并格式化成标准形式，即以 `/` 作为目录的分隔符。
        */
        join(...args) {
            let file = path.join(...args);
            file = exports.normalize(file);

            return file;
        },

        /**
        * 获取指定路径的所在目录。
        */
        dir(file) {
            let dir = path.dirname(file) + '/';
            dir = exports.normalize(dir);
            return dir;

        },

        /**
        * 获取指定路径的后缀名，包括 `.`，如 `.js`。
        */
        ext(...args) {
            return path.extname(...args);
        },

        /**
        * 获取指定路径的基本名称。
        */
        base(file, ext) {
            ext = ext || path.extname(file);

            let name = path.basename(file, ext);
            return name;
        },

        /**
        * 获取相对路径。
        */
        relative(...args) {
            let file = path.relative(...args);
            file = exports.normalize(file);

            return file;
        },
    };

});
