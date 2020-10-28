
/**
* 
*/
define('LessLink/Parser/Dest', function (require, module, exports) {
    const Path = require('Path');


    //根据当前 less 文件名相对网站的根目录取得相对路径组成的文件名。
    //如 htdocs = `htdocs/`，
    //如 less = `htdocs/html/test/view.less`，
    //则 name = `html.test.view.css`。
    function getName(htdocs, less) {
        // `html/test/view.less`
        let name = Path.relative(htdocs, less);

        //把 `/` 替换成 '.'，如 `html/test/view.less` 变成 `html.test.view.less`。
        name = name.split('/').join('.');

        //去掉后缀名，如 `html.test.view.less` 变成 `html.test.view`
        name = name.split('.').slice(0, -1).join('.');

        //`html.test.view` 变成 `html.test.view.css`
        name = name + '.css';

        return name;
    }




    return {
        /**
        * 根据网站的根目录、当前页面的目录和 less 文件名，计算出目标 css 文件的路径等信息。
        *   options = {
        *       htdocs: '',     //网站的根目录，如 `htdocs/`。
        *       dir: '',        //less 标签里的 href 属性相对的目录，即要解析的页面所在的目录，如 `htdocs/html/test/`。
        *       css: '',        //网站的样式目录，相对于网站根目录，如 `style/css/`。
        *       file: '',       //less 文件路径，如 `htdocs/html/test/view.less`。
        *   };
        */
        get(options) {
            let htdocs = options.htdocs;
            let dir = options.dir;
            let file = options.file;
            let cssDir = htdocs + options.css;     // css 目录完整路径。



            let name = getName(htdocs, file);
            let hrefDir = Path.relative(dir, cssDir) + '/';  //href 属性中使用的相对目录。

            let dest = cssDir + name;   //完整文件名。
            let href = hrefDir + name;  //相对路径。

            return {
                'name': name,   //`html.test.view.css`。
                'file': dest,   //`htdocs/style/css/html.test.view.css`。
                'href': href,   //`../../style/css/html.test.view.css`。

                'dir': {
                    'href': hrefDir,
                    'css': cssDir,
                },
            };
        },
    };
    
});


