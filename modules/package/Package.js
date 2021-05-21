
/**
* 私有包。
* 事件：
*   ('change', 'name');
*   ('change', 'content');
*   ('change');
*   ('compile', 'js-block'); //合并完成后、压缩之前，要对 js 内容进行转码的函数(如 babel 转码)。
*/
define('Package', function (require, module, exports) {
    const console = require('@webpart/console');
    const Tasker = require('@definejs/tasker');
    const Query = require('@definejs/query');
    const $Object = require('@definejs/object');
    const File = require('@definejs/file');
    const Emitter = require('@definejs/emitter');


    const Meta = module.require('Meta');
    const Parser = module.require('Parser');
    const LessBlock = module.require('LessBlock');
    const JsBlock = module.require('JsBlock');
    const HtmlBlock = module.require('HtmlBlock');
    const Watcher = module.require('Watcher');

    const mapper = new Map();


    class Package {

        /**
        * 构造器。
        *   config = {
        *       file: '',       //输入的源包文件。 如 `htdocs/html/test/modules/user/package.json`。
        *       htdocs: '',     //网站的根目录。
        *       css: '',        //css 打包后的输出目录，相对于网站根目录。 如 `style/css/`。
        *       dest: '',       //js 和 html 打包后的输出目录，相对于网站根目录。 如 `package/`。
        *   };
        */
        constructor(config) {
            config = Object.assign({}, config);

            let meta = Meta.create(config, {
                'emitter': new Emitter(this),
                'this': this,
            });

            mapper.set(this, meta);

            this.name = '';
        }

        /**
        * 当前包的名称。
        */
        name = '';

        /**
        * 重置。
        */
        reset() {
            let meta = mapper.get(this);
            Meta.reset(meta);
        }

        /**
        * 解析当前包文件。
        * 已重载 parse(); 
        * 已重载 parse(info); 给模块内部 `/Wacher`调用的。
        */
        parse(info) {
            let meta = mapper.get(this);

            info = info || Parser.parse(meta.file);

            Object.assign(meta, info);
            meta.LessBlock = LessBlock.create(meta);
            meta.JsBlock = JsBlock.create(meta);
            meta.HtmlBlock = HtmlBlock.create(meta);

            this.name = info.name; //增加一个字段。

            return info;


        }

        /**
        * 编译当前包文件。
        *   options = {
        *       minify: false,      //是否压缩。
        *       name: '{name}',     //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *       begin: '',          //可选。 合并 js 的闭包头文件。
        *       end: '',            //可选。 合并 js 的闭包的尾文件。
        *       done: fn,           //编译完成后要执行的回调函数。
        *   };
        */
        compile(options = {}) {
            let done = typeof options == 'function' ? options : options.done;
            let meta = mapper.get(this);

            let tasker = new Tasker([
                LessBlock,
                JsBlock,
                HtmlBlock,
            ]);

            tasker.on('each', function (M, index, done) {
                let config = {
                    'minify': options.minify,
                    'name': options.name,
                    'done': done,
                };

                //这些字段是针对 JsBlock 的。
                if (M === JsBlock) {
                    config.begin = options.begin;
                    config.end = options.end;
                }

                M.compile(meta, config);
            });

            tasker.on('all', function () {
                done && done.call(meta.this);
            });

            tasker.parallel();

        }

        /**
        * 监控当前包文件及各个资源引用模块。
        */
        watch() {
            let meta = mapper.get(this);

            if (meta.watcher) {
                return;
            }


            //为了使用子模块，这里单独成方法传进去。
            meta.watcher = Watcher.create(meta, {
                'LessBlock': LessBlock,
                'JsBlock': JsBlock,
                'HtmlBlock': HtmlBlock,

                'compare'() {
                    let info = Parser.compare(meta.file, meta);
                    return info;
                },
            });

            LessBlock.watch(meta);
            JsBlock.watch(meta);
            HtmlBlock.watch(meta);


        }


        /**
        * 获取包的输出内容。
        *   options = {
        *       query: {
        *           md5: 4,     //md5 的长度。 此字段是特殊的，当指定时，则认为是要截取的 md5 的长度。
        *       },
        *   };
        */
        get(options = {}) {
            let meta = mapper.get(this);
            let type$output = meta.type$output;
            let json = {};
            let query = Object.assign({}, options.query); //因为要删除 md5 字段，为避免互相影响，先拷贝一份。
            let md5Len = query['md5'] || 0;

            delete query['md5'];


            $Object.each(type$output, (type, output) => {
                if (!output) {
                    return;
                }

                let href = output.href;

                if (!href) {
                    return;
                }

                let md5 = output.md5.slice(0, md5Len);
                if (md5) {
                    href = Query.add(href, md5);
                }

                if (!$Object.isEmpty(query)) {
                    href = Query.add(href, query);
                }

                json[type] = href;

            });


            return {
                'name': meta.name,
                'old': meta.old.name,
                'json': json,
            };
        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        /**
        * 销毁当前对象。
        */
        destroy() {
            let meta = mapper.get(this);
            if (!meta) { //已销毁。
                return;
            }

            let old = meta.old;


            meta.emitter.destroy();
            meta.watcher && meta.watcher.destroy();

            meta.LessBlock && meta.LessBlock.destroy();
            old.LessBlock && old.LessBlock.destroy();

            meta.JsBlock && meta.JsBlock.destroy();
            old.JsBlock && old.JsBlock.destroy();

            meta.HtmlBlock && meta.HtmlBlock.destroy();
            old.HtmlBlock && old.HtmlBlock.destroy();

            //删除对应的输出文件。
            $Object.each(meta.type$output, (type, output) => {
                if (!output || !output.dest) {
                    return;
                }

                let dest = output.dest;
                File.delete(dest);
                console.log('删除'.red, dest.gray);
            });

            mapper.delete(this);
        }
    }







    return Package;


});




