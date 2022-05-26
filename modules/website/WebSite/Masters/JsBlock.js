
/**
* 
*/
define('WebSite/Masters/JsBlock', function (require, module, exports) {


    return {

        normalize(meta, opt) {

            opt = Object.assign({}, opt, {

                //让外界有机会对合并后的 js 内容进行转换(如 babel)。
                'transform'(...args) {
                    let values = meta.emitter.fire('build', 'js-block', args);
                    return values.slice(-1)[0];
                },
            });


            //短路径补全。
            let cwd = meta.cwd;
            let begin = opt.begin;
            let end = opt.end;

            if (begin) {
                opt.begin = cwd + begin;
            }

            if (end) {
                opt.end = cwd + end;
            }

            return opt;

        },

    };




});




