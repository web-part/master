
/**
* 
*/
define('Package/LessBlock', function (require, module, exports) {
    const $String = require('@definejs/string');
    const File = require('@definejs/file');
    
    const LessBlock = require('LessBlock');


    return {
        /**
        * 
        * 根据路径模式，尽量复用以前的实例和输出结果。
        */
        create(meta) {
            let patterns = meta.patterns.less;
            let old = meta.old;
            let block = old.LessBlock;

            if (!patterns || !patterns.length) {
                block && block.destroy();
                old.LessBlock = null;
                return null;
            }


            let key0 = patterns.join();
            let key1 = old.patterns.less.join();

            //路径模式不变，则复用之前的(如果有)。
            if (key0 == key1 && block) {
                meta.type$output['css'] = old.type$output['css'];
                meta.compile['css'] = old.compile['css'];
                return block;
            }

            //路径模式不同，要新建。

            block = new LessBlock({
                'htdocs': meta.htdocs,
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
        *       done: fn,           //编译完成后要执行的回调函数。
        *   };
        */
        compile(meta, opt = {}) {
            let done = typeof opt == 'function' ? opt : opt.done;
            let block = meta.LessBlock;

            if (!block) {
                return done();
            }

            //先使用缓存。
            let key = JSON.stringify(opt);
            let output = meta.compile['css'][key];

            if (output) {
                meta.type$output['css'] = output;   //引到用最近一次的。
                return done();
            }

            //
            block.compile({
                'minify': opt.minify,
                'concat': true,

                'done'(info) {
                    let content = info.content;
                    let md5 = info.md5;

                    let sample = meta.css + opt.name + '.css';

                    let href = $String.format(sample, {
                        'name': meta.name,
                        'md5': md5,
                    });

                    let dest = meta.htdocs + href;



                    //有可能是空内容。
                    let output = !content ? {} : {
                        'dest': dest,
                        'href': href,
                        'md5': md5,
                        'minify': opt.minify,
                    };

                    meta.type$output['css'] = output;
                    meta.compile['css'][key] = output;

                    content && File.write(dest, content);  //有内容才写入。

                    done();
                },
            });
        },

        watch(meta) {
            let block = meta.LessBlock;
            if (!block) {
                return;
            }


            block.on('change',  function () {
                meta.expire('css');
                meta.emitter.fire('change');
            });

            block.watch();

        },

       


    };
    
});


