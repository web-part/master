
/**
* 对第三方库 html 的封装。
*/
define('Html', function (require, module, exports) {
    const Minifier = require('html-minifier');    //https://github.com/kangax/html-minifier
    const Defaults = require('Defaults');
    

    return {
        /**
        * 对 html 进行压缩。
        */
        minify(html, options) {
            if (options === true) {
                options = null;
            }

            options = Defaults.get(module, options || {});
            
            html = Minifier.minify(html, options);

            return html;
        },
    };

});




