
/**
* 
*/
define('WebSite/Masters/JsBlock', function (require, module, exports) {


    return {

        normalize(meta, options) {

            options = Object.assign({}, options, {

                //让外界有机会对合并后的 js 内容进行转换(如 babel)。
                'transform'(content, data) {
                    let args = [...arguments];
                    let values = meta.emitter.fire('build', 'js-block', args);
                    return values.slice(-1)[0];
                },
            });


            //短路径补全。
            let cwd = meta.cwd;
            let begin = options.begin;
            let end = options.end;

            if (begin) {
                options.begin = cwd + begin;
            }

            if (end) {
                options.end = cwd + end;
            }

            return options;

        },

    };




});




