
/**
* 
*/
define('Package/HtmlBlock', function (require, module, exports) {
    const $String = require('@definejs/string');
    const File = require('@definejs/file');

    const HtmlBlock = require('HtmlBlock');
    const Path = require('Path');


    return {
        /**
        * 
        * 根据路径模式，尽量复用以前的实例和输出结果。
        */
        create(meta) {
            let patterns = meta.patterns.html;
            let old = meta.old;
            let block = old.HtmlBlock;

            if (!patterns || !patterns.length) {
                block && block.destroy();
                old.HtmlBlock = null;
                return null;
            }


            let key0 = patterns.join();
            let key1 = old.patterns.html.join();

            //路径模式不变，则复用之前的(如果有)。
            if (key0 == key1 && block) {
                meta.type$output['html'] = old.type$output['html'];
                meta.compile['html'] = old.compile['html'];
                return block;
            }

            //路径模式不同，要新建。

            block = new HtmlBlock({
                'dir': meta.dir,
                'patterns': patterns,
                'delay': 0,
            });

            block.parse();

            return block;

        },


        /**
        * 编译。
        *   options = {
        *       minify: false,      //是否压缩。
        *       name: '{name}',     //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *       done: fn,           //编译完成后要执行的回调函数。
        *   };
        */
        compile(meta, options = {}) {
            let done = typeof options == 'function' ? options : options.done;
            let block = meta.HtmlBlock;

            if (!block) {
                return done();
            }

            //先使用缓存。
            let key = JSON.stringify(options);
            let output = meta.compile['html'][key];

            if (output) {
                meta.type$output['html'] = output;   //引到用最近一次的。
                return done();
            }


            let info = block.compile({
                'tabs': 0,
                'minify': options.minify,

                //合并完成后，要对 html 内容进行转码的函数。
                'transform'(content, data) {
                    let args = [...arguments];
                    let values = meta.emitter.fire('compile', 'html-block', args);
                    return values.slice(-1)[0];
                },
            });

            let content = info.content;
            let sample = meta.dest + options.name + '.html';

            let dest = $String.format(sample, {
                'name': meta.name,
                'md5': info.md5,
            });

            let href = Path.relative(meta.htdocs, dest);


            //有可能是空内容。
            output = !content ? {} : {
                'dest': dest,
                'href': href,
                'md5': info.md5,
                'minify': options.minify,
            };

            meta.type$output['html'] = output;
            meta.compile['html'][key] = output;

            content && File.write(dest, content);  //有内容才写入。

            done();

        },



        watch(meta) {
            let block = meta.HtmlBlock;
            if (!block) {
                return;
            }


            block.on('change', function () {
                meta.expire('html');
                meta.emitter.fire('change');
            });

            block.watch();

        },




    };

});


