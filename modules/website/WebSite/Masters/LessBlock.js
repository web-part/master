
/**
* 
*/
define('WebSite/Masters/LessBlock', function (require, module, exports) {


    return {

        normalize(meta, opt) {
            if (!opt) {
                return opt;
            }

            //短路径补全。
            let name = opt.name;

            //把 name 字段补完整路径，添加一个 dest 字段。
            if (name) {
                opt['dest'] = meta.cwd + meta.css + name;
            }

            return opt;

        },

    };




});




