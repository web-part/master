
/**
* 
*/
define('Package/JsBlock', function (require, module, exports) {
    const $String = require('@definejs/string');
    const File = require('@definejs/file');

    const JsBlock = require('JsBlock');
    const Path = require('Path');


    return {
        /**
        * 
        * 根据路径模式，尽量复用以前的实例和输出结果。
        */
        create(meta) {
            let patterns = meta.patterns.js;
            let old = meta.old;
            let block = old.JsBlock;

            if (!patterns || !patterns.length) {
                block && block.destroy();
                old.JsBlock = null;
                return null;
            }


            let key0 = patterns.join();
            let key1 = old.patterns.js.join();

            //路径模式不变，则复用之前的(如果有)。
            if (key0 == key1 && block) {
                meta.type$output['js'] = old.type$output['js'];
                meta.compile['js'] = old.compile['js'];
                return block;
            }

            //路径模式不同，要新建。

            block = new JsBlock({
                'dir': meta.dir,
                'patterns': patterns,
                'delay': 0,
            });

          

            block.parse();

            return block;
            
        },

        /**
        * 编译。
        *   opt = {
        *       minify: false,      //是否压缩。
        *       name: '{name}',     //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *       begin: '',          //可选。 合并 js 的闭包的头文件。
        *       end: '',            //可选。 合并 js 的闭包的尾文件。
        *       done: fn,           //编译完成后要执行的回调函数。
        *   };
        */
        compile(meta, opt = {}) {
            let done = typeof opt == 'function' ? opt : opt.done;
            let block = meta.JsBlock;

            if (!block) {
                return done();
            }

            //先使用缓存。
            let key = JSON.stringify(opt);
            let output = meta.compile['js'][key];

            if (output) {
                meta.type$output['js'] = output;   //引到用最近一次的。
                return done();
            }


            let info = block.concat({
                'minify': opt.minify,
                'begin': opt.begin,
                'end': opt.end,
                'each': function (...args) { 
                    let values = meta.emitter.fire('concat', 'js-block', args);
                    return values.slice(-1)[0];
                },

                'transform'(content, data) {
                    let values = meta.emitter.fire('compile', 'js-block', [content, {
                        'name': meta.name,
                        'md5': data.md5,
                        'list': data.files,          //合并的源文件列表。
                    }]);

                    return values.slice(-1)[0];
                },
            });

            let content = info.content;
            let sample = meta.dest + opt.name + '.js';

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
                'minify': opt.minify,
            };

            meta.type$output['js'] = output;
            meta.compile['js'][key] = output;

            content && File.write(dest, content);  //有内容才写入。

            done();
        },


        /**
        * 
        */
        watch(meta) {
            let block = meta.JsBlock;
            if (!block) {
                return;
            }


            block.on('change',  function () {
                meta.expire('js');
                meta.emitter.fire('change');
            });

            block.watch();

        },

       


    };
    
});


