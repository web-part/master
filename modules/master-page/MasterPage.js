
/**
* 母版页类。
* 事件：
    ('render', 'master');
    ('render', 'js-link');
    ('change');
*/
define('MasterPage', function (require, module, exports) {
    const File = require('@definejs/file');
    const Tasker = require('@definejs/tasker');
    const Emitter = require('@definejs/emitter');
    const $String = require('@definejs/string');
    const MD5 = require('@definejs/md5');

    const Defaults = require('Defaults');
    const Lines = require('Lines');
    const Html = require('Html');
    const HtmlLink = require('HtmlLink');

    const Meta = module.require('Meta');
    const Watcher = module.require('Watcher');
    const Validater = module.require('Validater');
    const CssLinks = module.require('CssLinks');
    const LessLinks = module.require('LessLinks');
    const HtmlLinks = module.require('HtmlLinks');
    const JsLinks = module.require('JsLinks');
    const HtmlBlocks = module.require('HtmlBlocks');
    const LessBlocks = module.require('LessBlocks');
    const JsBlocks = module.require('JsBlocks');

    const mapper = new Map();

    class MasterPage {
        /**
        * 构造器。
        *   config = {
        *       file: '',       //输入的母版页文件路径。 如 `htdocs/html/test/index.master.html`。
        *       htdocs: '',     //网站的根目录。 如 `htdocs/`。
        *       css: '',        //样式目录，相对于 htdocs。 如 `style/css/`。
        *       dest: '',       //输出的目标页面的名称模板。 如 `{name}.html`。
        *       excludes: {     //
        *           less: [],   //
        *           html: [],   //
        *           js: [],     //
        *       },
        *   };
        */
        constructor(config) {
            config = Defaults.get(module, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'emitter': emitter,
                'this': this,
            });


            mapper.set(this, meta);

            Object.assign(this, {
                'id': meta.id,
                'data': {},           //用户自定义数据容器。
            });
        }

        data = {};

        /**
        * 重置为初始状态，为新一轮的解析做准备。
        */
        reset() {
            let meta = mapper.get(this);
            Meta.reset(meta);
        }

        /**
        * 解析。
        */
        parse() {
            let meta = mapper.get(this);
            let file = meta.file;
            let content = File.read(file);

            let content2 = meta.emitter.fire('parse', 'master', [file, content, {
                'id': meta.id,          //当前实例 id。
                'name': meta.name,      //短名称。
                'dir': meta.dir,        //当前母版页所在的目录。
                'dest': meta.dest,      //输出的目标页面的路径。
                'htdocs': meta.htdocs,  //网站的根目录。
                'css': meta.css,        //样式目录，相对于网站的根目录，如 `style/css/`。

            }]).slice(-1)[0];


            meta.content = typeof content2 == 'string' ? content2 : content;
            meta.lines = Lines.split(meta.content);

            meta.CssLinks = CssLinks.parse(meta);
            meta.LessLinks = LessLinks.parse(meta);
            meta.HtmlLinks = HtmlLinks.parse(meta);
            meta.JsLinks = JsLinks.parse(meta);

            meta.HtmlBlocks = HtmlBlocks.parse(meta);
            meta.LessBlocks = LessBlocks.parse(meta);
            meta.JsBlocks = JsBlocks.parse(meta);

        }

        /**
         * 设置特定的字段。
         */
        set(key, value) {
            let meta = mapper.get(this);

            switch (key) {
                case 'excludes':
                    meta.LessBlocks.forEach((item) => {
                        item.block.set(key, value['less']);
                    });

                    meta.HtmlBlocks.forEach((item) => {
                        item.block.set(key, value['html']);
                    });

                    meta.JsBlocks.forEach((item) => {
                        item.block.set(key, value['js']);
                    });

                    break;
            }
        }

        /**
        * 渲染生成 html (文件)。
        *   opt = {
        *       minify: false,      //可选。 是否压缩。
        *       dest: true | '',    //是否输出目标文件，或者指定为一个文件路径。 支持 `{name}`、`{md5}` 模板字段。
        *   };
        */
        render(opt = {}) {
            let { minify, dest, } = opt;

            let meta = mapper.get(this);
            let html = Lines.stringify(meta.lines);

            html = HtmlLink.replaceTabs(html);


            // let invalid = Validater.checkIds(html);
            //if (invalid) {
            //    throw new Error();
            //}

            if (minify) {
                html = Html.minify(html, minify);
            }


            let md5 = MD5.get(html);


            if (dest) {
                dest = dest === true ? meta.dest : dest;

                dest = $String.format(dest, {
                    'name': meta.name,
                    'md5': md5,
                });
            }

            //取事件的最后一个回调的返回值作为要渲染的内容（如果有）。
            //最后一个参数传一个 object 出去，让外界面尽可能多的拿到一些元数据。
            let html2 = meta.emitter.fire('render', 'master', [dest, html, {
                'minify': minify,       //是否压缩。
                'md5': md5,             //html 内容的 md5 值。
                'id': meta.id,          //当前实例 id。
                'name': meta.name,      //短名称。
                'file': meta.file,      //当前母版页的文件路径。
                'dir': meta.dir,        //当前母版页所在的目录。
                'dest': meta.dest,      //输出的目标页面的路径。
                'htdocs': meta.htdocs,  //网站的根目录。
                'css': meta.css,        //样式目录，相对于网站的根目录，如 `style/css/`。
            }]).slice(-1)[0];


            if (typeof html2 == 'string') {
                html = html2;
            }

            if (dest) {
                File.write(dest, html);
            }

            return html;
        }

        /**
        * 编译当前母版页。
        *   opt = {
        *       minify: false,  //可选，是否压缩。
        *       done: fn,       //可选，编译完成后要执行的回调函数。
        *   };
        */
        compile(opt = {}) {
            let done = typeof opt == 'function' ? opt : opt.done;
            let meta = mapper.get(this);

            let tasker = new Tasker([
                CssLinks,
                LessLinks,
                HtmlLinks,
                JsLinks,

                LessBlocks,
                HtmlBlocks,
                JsBlocks,
            ]);

            tasker.on('each',  function (M, index, done) {
                M.render(meta, done);
            });

            tasker.on('all',  function () {
                meta.this.render({
                    'minify': opt.minify,
                    'dest': true,
                });

                done && done.call(meta.this);
            });

            tasker.parallel();

        }

        /**
        * 监控。
        */
        watch() {
            let meta = mapper.get(this);

            meta.watcher = meta.watcher || Watcher.create(meta);

            CssLinks.watch(meta);
            LessLinks.watch(meta);
            HtmlLinks.watch(meta);
            JsLinks.watch(meta);

            HtmlBlocks.watch(meta);
            LessBlocks.watch(meta);
            JsBlocks.watch(meta);
        }

        /**
        * 构建。
        *   opt = {
        *       lessLink: {
        *           minify: true,       //是否压缩。
        *           name: '{md5}.css',  //如果指定，则输出目标文件。 支持模板字段 `{name}` 和 `{md5}`。
        *           md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *           query: null || fn,  //添加到 href 中 query 部分。
        *       },
        *       lessBlock: {
        *           minify: false,      //是否压缩。
        *           inline: false,      //是否内联。
        *           dest: '{md5}.css',  //输出的目标文件名。 支持 `{md5}` 模板字段。 
        *           props: {},          //输出到标签里的 html 属性。
        *           query: {},          //生成到 href 属性中的 query 部分。
        *       },
        *       jsBlock: {
        *           begin: '',          //闭包的头片段文件路径。
        *           end: '',            //闭包的尾片段文件路径。
        *           minify: false,      //是否压缩。
        *           inline: false,      //是否内联。
        *           name: '{md5}'.js,   //输出的目标文件路径，支持 `{md5}` 模板字段。 目录为当前页面所在的目录。
        *           props: {},          //生成到标签里的其它属性。
        *           query: {},          //生成标签 src 属性里的 query 部分。 
        *           transform: fn,      //可选。 合并完成后、压缩之前，要对 js 内容进行转码的函数(如 babel 转码)。
        *       },
        *       html: {
        *           minify: false,      //是否压缩。    
        *       },
        *       done: fn,               //构建完成后要执行的回调函数。
        *   };
        */
        build(opt = {}) {
            let done = typeof opt == 'function' ? opt : opt.done;
            let meta = mapper.get(this);

            let tasker = new Tasker([
                { 'fn': CssLinks.build, },
                { 'fn': LessLinks.build, 'opt': opt.lessLink, },
                { 'fn': HtmlLinks.render, },
                { 'fn': JsLinks.build, },

                { 'fn': LessBlocks.build, 'opt': opt.lessBlock, },
                { 'fn': HtmlBlocks.render, },
                { 'fn': JsBlocks.build, 'opt': opt.jsBlock, },
            ]);

            tasker.on('each', function ({ fn, opt, }, index, done) {
                opt ? fn(meta, opt, done) : fn(meta, done);

            });

            tasker.on('all', function () {
                let data = opt.html || {};

                meta.this.render({
                    'minify': data.minify,
                    'dest': true,
                });

                done && done.call(meta.this);
            });

            tasker.parallel();


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

            meta.link.destroy();
            meta.emitter.destroy();
            meta.watcher && meta.watcher.destroy();

            [
                ...meta.CssLinks,
                ...meta.LessLinks,
                ...meta.HtmlLinks,
                ...meta.JsLinks,
            ].forEach((item) => {
                item.link.destroy();
            });

            [
                ...meta.LessBlocks,
                ...meta.HtmlBlocks,
                ...meta.JsBlocks,
            ].forEach((item) => {
                item.block.destroy();
            });


            mapper.delete(this);
        }

        toJSON() {
            let meta = mapper.get(this);

            let cssLinks = CssLinks.toJSON(meta);
            let htmlLinks = HtmlLinks.toJSON(meta);
            let jsLinks = JsLinks.toJSON(meta);
            let lessLinks = LessLinks.toJSON(meta);
            let htmlBlocks = HtmlBlocks.toJSON(meta);
            let jsBlocks = JsBlocks.toJSON(meta);
            let lessBlocks = LessBlocks.toJSON(meta);

            return {
                'type': module.id,

                'id': meta.id,
                'name': meta.name,
                'file': meta.file,
                'dir': meta.dir,
                'dest': meta.dest,
                'htdocs': meta.htdocs,
                'css': meta.css,
                'content': meta.content,
                'excludes': meta.excludes,
                'tags': meta.tags,

                'cssLinks': cssLinks,
                'htmlLinks': htmlLinks,
                'jsLinks': jsLinks,
                'lessLinks': lessLinks,
                'htmlBlocks': htmlBlocks,
                'jsBlocks': jsBlocks,
                'lessBlocks': lessBlocks,
            };
        }



    }


    return MasterPage;

});




