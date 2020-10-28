
/**
* 
*/
define('Package/Parser/Name', function (require, module, exports) {
    const Patterns = require('@definejs/patterns');
    
    const Path = require('Path');


    return {
        /**
        * 解析。
        *   options = {
                name: '',
                dir: '',
            };
        */
        get(options) {
            let name = options.name;
            if (name) {
                return name;
            }

            //如果未指定 name，则以包文件所在的目录的第一个 js 文件名作为 name。

            let dir = options.dir;
            let files = Patterns.getFiles(dir, '*.js');

            name = files[0];

            if (!name) {
                return;
            }

            name = Path.relative(dir, name);
            name = name.slice(0, -3); //去掉 `.js` 后缀。

            return name;



        },

    };
    
});


